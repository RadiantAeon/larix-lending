use super::{obligation::{Obligation, ObligationLiquidity, ObligationCollateral}, pack_bool, pack_decimal, PROGRAM_VERSION, unpack_bool, unpack_decimal};
use crate::{
    math::{Decimal, Rate, TryDiv, TryMul, TrySub, TryAdd}, error::LendingError, state::HOST_FEE_RECEIVER_COUNT,
};
use arrayref::{array_mut_ref, array_ref, array_refs, mut_array_refs};
use solana_program::{
    clock::Slot,
    msg,
    program_error::ProgramError,
    program_pack::{IsInitialized, Pack, Sealed},
    pubkey::{Pubkey, PUBKEY_BYTES}, entrypoint::ProgramResult,
};
use std::{
    convert::{TryFrom}, cmp::Ordering,
};
use crate::state::last_update::LastUpdate;

pub mod init_reserve_accounts_index{
    ///   0. `[writable]` Reserve account - uninitialized.
    pub const RESERVE_ACCOUNT:usize = 0 as usize;
    ///   1. `[]` Reserve liquidity SPL Token mint.
    pub const LIQUIDITY_MINT:usize = 1 as usize;
    ///   2. `[]` Reserve liquidity supply SPL Token account.
    pub const LIQUIDITY_SUPPLY:usize = 2 as usize;
    ///   3. `[]` Reserve liquidity fee receiver.
    pub const LIQUIDITY_FEE_RECEIVER:usize = 3 as usize;
    ///   4. `[]` Pyth product account.
    pub const PYTH_PRODUCT:usize = 4 as usize;
    ///   5. `[]` Pyth price account.
    ///             This will be used as the reserve liquidity oracle account.
    pub const PYTH_PRICE:usize = 5 as usize;
    ///   6  '[]' Larix oracle id
    pub const LARIX_ORACLE:usize = 6 as usize;
    ///   7. `[]` Reserve collateral SPL Token mint.
    pub const COLLATERAL_MINT:usize = 7 as usize;
    ///   8. `[]` Reserve collateral token supply.
    pub const COLLATERAL_SUPPLY:usize = 8 as usize;
    ///   9  `[]` Lending market account.
    pub const LENDING_MARKET:usize = 9 as usize;
    ///   10  `[signer]` Lending market owner.
    pub const LENDING_MARKET_OWNER:usize = 10 as usize;
    ///   11. `[]` Un_coll_supply_account
    pub const UN_COLL_SUPPLY:usize = 11 as usize;
    ///   12  `[]` Clock sysvar.
    pub const CLOCK_SYSVAR:usize = 12 as usize;
    ///   13 `[]` Rent sysvar.
    pub const RENT_SYSVAR:usize = 13 as usize;
    ///   14 `[]` Token program id.
    pub const TOKEN_PROGRAM_ID:usize = 14 as usize;
}


/// Percentage of an obligation that can be repaid during each liquidation call
pub const LIQUIDATION_CLOSE_FACTOR: u8 = 50;

/// Obligation borrow amount that is small enough to close out
pub const LIQUIDATION_CLOSE_AMOUNT: u64 = 2;

/// Lending market reserve state
#[derive(Clone, Debug, Default, PartialEq)]
pub struct Reserve {
    /// Version of the struct
    pub version: u8,
    /// Last slot when supply and rates updated
    pub last_update: LastUpdate,
    /// Lending market address
    pub lending_market: Pubkey,

    /// Reserve liquidity
    pub liquidity: ReserveLiquidity,
    /// Reserve collateral
    pub collateral: ReserveCollateral,
    /// Reserve configuration values
    pub config: ReserveConfig,
    /// Bonus (used for storing mining-info of a reserve)
    pub bonus: Bonus,
    /// Entry lock
    pub reentry_lock: bool

}


/// Calculate borrow result
#[derive(Debug)]
pub struct CalculateBorrowResult {
    /// Total amount of borrow including fees
    pub borrow_amount: Decimal,
    /// Borrow amount portion of total amount
    pub receive_amount: u64,
    /// Loan origination fee
    pub borrow_fee: u64,
    /// Host fee portion of origination fee
    pub host_fee: u64,
}

/// Calculate repay result
#[derive(Debug)]
pub struct CalculateRepayResult {
    /// Amount of liquidity that is settled from the obligation.
    pub settle_amount: Decimal,
    /// Amount that will be repaid as u64
    pub repay_amount: u64,
}

/// Calculate liquidation result
#[derive(Debug)]
pub struct CalculateLiquidationResult {
    /// Amount of liquidity that is settled from the obligation. It includes
    /// the amount of loan that was defaulted if collateral is depleted.
    pub settle_amount: Decimal,
    /// Amount that will be repaid as u64
    pub repay_amount: u64,
    /// Amount of collateral to withdraw in exchange for repay amount
    pub withdraw_amount: u64,
}

/// Reserve liquidity
#[derive(Clone, Debug, Default, PartialEq)]
pub struct ReserveLiquidity {
    /// Is the mint address a lp
    pub is_lp:bool,
    /// Reserve liquidity mint address
    pub mint_pubkey: Pubkey,
    /// Reserve liquidity mint decimals
    pub mint_decimals: u8,
    /// Reserve liquidity supply address
    pub supply_pubkey: Pubkey,
    /// Reserve liquidity fee receiver address
    pub fee_receiver: Pubkey,
    /// If use pyth oracle
    pub use_pyth_oracle: bool,
    /// Reserve liquidity pyth oracle account when is_lp is false
    /// BridgePool account of bridge program when is_lp is true
    pub pyth_oracle: Pubkey,
    /// Reserve liquidity larix oracle account when is_lp is false
    /// LpPrice account of bridge program when is_lp is true
    pub larix_oracle: Pubkey,
    /// Reserve liquidity available
    pub available_amount: u64,
    /// Reserve liquidity borrowed
    pub borrowed_amount_wads: Decimal,
    /// Reserve liquidity cumulative borrow rate
    pub cumulative_borrow_rate_wads: Decimal,
    /// Reserve liquidity market price in quote currency
    pub market_price: Decimal,
    /// unclaimed fee by reserve owner
    pub owner_unclaimed: Decimal
}

impl ReserveLiquidity {
    /// Calculate the total reserve supply including active loans
    pub fn total_supply(&self) -> Result<Decimal, ProgramError> {
        Decimal::from(self.available_amount).try_add(self.borrowed_amount_wads)
    }

    /// Add liquidity to available amount
    pub fn deposit(&mut self, liquidity_amount: u64) -> ProgramResult {
        self.available_amount = self
            .available_amount
            .checked_add(liquidity_amount)
            .ok_or(LendingError::MathOverflow)?;
        Ok(())
    }

    /// Remove liquidity from available amount
    pub fn withdraw(&mut self, liquidity_amount: u64) -> ProgramResult {
        if liquidity_amount > self.available_amount {
            msg!("Withdraw amount cannot exceed available amount");
            return Err(LendingError::InsufficientLiquidity.into());
        }
        self.available_amount = self
            .available_amount
            .checked_sub(liquidity_amount)
            .ok_or(LendingError::MathOverflow)?;
        Ok(())
    }

    /// Subtract borrow amount from available liquidity and add to borrows
    pub fn borrow(&mut self, borrow_decimal: Decimal) -> ProgramResult {
        let borrow_amount = borrow_decimal.try_floor_u64()?;
        if borrow_amount > self.available_amount {
            msg!("Borrow amount cannot exceed available amount");
            return Err(LendingError::InsufficientLiquidity.into());
        }

        self.available_amount = self
            .available_amount
            .checked_sub(borrow_amount)
            .ok_or(LendingError::MathOverflow)?;
        self.borrowed_amount_wads = self.borrowed_amount_wads.try_add(borrow_decimal)?;

        Ok(())
    }

    /// Add repay amount to available liquidity and subtract settle amount from total borrows
    pub fn repay(&mut self, repay_amount: u64, settle_amount: Decimal) -> ProgramResult {
        self.available_amount = self
            .available_amount
            .checked_add(repay_amount)
            .ok_or(LendingError::MathOverflow)?;
        let safe_settle_amount = settle_amount.min(self.borrowed_amount_wads);
        self.borrowed_amount_wads = self.borrowed_amount_wads.try_sub(safe_settle_amount)?;

        Ok(())
    }

    /// Calculate the liquidity utilization rate of the reserve
    pub fn utilization_rate(&self) -> Result<Rate, ProgramError> {
        let total_supply = self.total_supply()?;
        if total_supply == Decimal::zero() {
            return Ok(Rate::zero());
        }
        self.borrowed_amount_wads.try_div(total_supply)?.try_into()
    }

    /// Compound current borrow rate over elapsed slots
    fn compound_interest(
        &mut self,
        current_borrow_rate: Rate,
        slots_elapsed: u64,
    ) -> ProgramResult {
        let slot_interest_rate = current_borrow_rate.try_div(crate::state::SLOTS_PER_YEAR)?;
        let compounded_interest_rate = Rate::one()
            .try_add(slot_interest_rate)?
            .try_pow(slots_elapsed)?;
        self.cumulative_borrow_rate_wads = self
            .cumulative_borrow_rate_wads
            .try_mul(compounded_interest_rate)?;
        self.borrowed_amount_wads = self
            .borrowed_amount_wads
            .try_mul(compounded_interest_rate)?;
        Ok(())
    }
}

impl Reserve {
    /// Create a new reserve
    pub fn new(params: InitReserveParams) -> Self {
        let mut reserve = Self::default();
        Self::init(&mut reserve, params);
        reserve
    }

    /// Initialize a reserve
    pub fn init(&mut self, params: InitReserveParams) {
        self.version = crate::state::PROGRAM_VERSION;
        self.last_update = LastUpdate::new(params.current_slot);
        self.lending_market = params.lending_market;
        self.liquidity = params.liquidity;
        self.collateral = params.collateral;
        self.config = params.config;
    }

    /// Calculate the current borrow rate
    pub fn current_borrow_rate(&self) -> Result<Rate, ProgramError> {
        let utilization_rate = self.liquidity.utilization_rate()?;
        let optimal_utilization_rate = Rate::from_percent(self.config.optimal_utilization_rate);
        let low_utilization = utilization_rate < optimal_utilization_rate;
        if low_utilization || self.config.optimal_utilization_rate == 100 {
            let normalized_rate = utilization_rate.try_div(optimal_utilization_rate)?;
            let min_rate = Rate::from_percent(self.config.min_borrow_rate);
            let rate_range = Rate::from_percent(
                self.config
                    .optimal_borrow_rate
                    .checked_sub(self.config.min_borrow_rate)
                    .ok_or(LendingError::MathOverflow)?,
            );

            Ok(normalized_rate.try_mul(rate_range)?.try_add(min_rate)?)
        } else {
            let normalized_rate = utilization_rate
                .try_sub(optimal_utilization_rate)?
                .try_div(Rate::from_percent(
                    100u8
                        .checked_sub(self.config.optimal_utilization_rate)
                        .ok_or(LendingError::MathOverflow)?,
                ))?;
            let min_rate = Rate::from_percent(self.config.optimal_borrow_rate);
            let rate_range = Rate::from_percent(
                self.config
                    .max_borrow_rate
                    .checked_sub(self.config.optimal_borrow_rate)
                    .ok_or(LendingError::MathOverflow)?,
            );

            Ok(normalized_rate.try_mul(rate_range)?.try_add(min_rate)?)
        }
    }

    /// Collateral exchange rate
    pub fn collateral_exchange_rate(&self) -> Result<CollateralExchangeRate, ProgramError> {
        let total_liquidity = self.liquidity.total_supply()?;
        self.collateral.exchange_rate(total_liquidity)
    }

    /// Update borrow rate and accrue interest
    pub fn accrue_interest(&mut self, current_slot: Slot) -> ProgramResult {
        let slots_elapsed = self.last_update.slots_elapsed(current_slot)?;
        if slots_elapsed > 0 {
            let current_borrow_rate = self.current_borrow_rate()?;
            self.liquidity
                .compound_interest(current_borrow_rate, slots_elapsed)?;
        }
        Ok(())
    }

    /// Repay liquidity up to the borrowed amount
    pub fn calculate_repay(
        &self,
        amount_to_repay: u64,
        borrowed_amount: Decimal,
    ) -> Result<CalculateRepayResult, ProgramError> {
        let settle_amount = if amount_to_repay == u64::MAX {
            borrowed_amount
        } else {
            Decimal::from(amount_to_repay).min(borrowed_amount)
        };
        let repay_amount = settle_amount.try_ceil_u64()?;

        Ok(CalculateRepayResult {
            settle_amount,
            repay_amount,
        })
    }

    /// Liquidate some or all of an unhealthy obligation
    pub fn calculate_liquidation(
        &self,
        amount_to_liquidate: u64,
        obligation: &Obligation,
        liquidity: &ObligationLiquidity,
        collateral: &ObligationCollateral,
    ) -> Result<CalculateLiquidationResult, ProgramError> {
        let bonus_rate = Rate::from_percent(self.config.liquidation_bonus).try_add(Rate::one())?;

        let max_amount = if amount_to_liquidate == u64::MAX {
            liquidity.borrowed_amount_wads
        } else {
            Decimal::from(amount_to_liquidate).min(liquidity.borrowed_amount_wads)
        };

        let settle_amount;
        let repay_amount;
        let withdraw_amount;

        // Close out obligations that are too small to liquidate normally
        if liquidity.borrowed_amount_wads < LIQUIDATION_CLOSE_AMOUNT.into() {
            // settle_amount is fixed, calculate withdraw_amount and repay_amount
            settle_amount = liquidity.borrowed_amount_wads;

            let liquidation_value = liquidity.market_value.try_mul(bonus_rate)?;
            match liquidation_value.cmp(&collateral.market_value) {
                Ordering::Greater => {
                    let repay_pct = collateral.market_value.try_div(liquidation_value)?;
                    repay_amount = max_amount.try_mul(repay_pct)?.try_ceil_u64()?;
                    withdraw_amount = collateral.deposited_amount;
                }
                Ordering::Equal => {
                    repay_amount = max_amount.try_ceil_u64()?;
                    withdraw_amount = collateral.deposited_amount;
                }
                Ordering::Less => {
                    let withdraw_pct = liquidation_value.try_div(collateral.market_value)?;
                    repay_amount = max_amount.try_ceil_u64()?;
                    withdraw_amount = Decimal::from(collateral.deposited_amount)
                        .try_mul(withdraw_pct)?
                        .try_floor_u64()?;
                }
            }
        } else {
            // calculate settle_amount and withdraw_amount, repay_amount is settle_amount rounded
            let liquidation_amount = obligation
                .max_liquidation_amount(liquidity)?
                .min(max_amount);
            let liquidation_pct = liquidation_amount.try_div(liquidity.borrowed_amount_wads)?;
            let liquidation_value = liquidity
                .market_value
                .try_mul(liquidation_pct)?
                .try_mul(bonus_rate)?;

            match liquidation_value.cmp(&collateral.market_value) {
                Ordering::Greater => {
                    let repay_pct = collateral.market_value.try_div(liquidation_value)?;
                    settle_amount = liquidation_amount.try_mul(repay_pct)?;
                    repay_amount = settle_amount.try_ceil_u64()?;
                    withdraw_amount = collateral.deposited_amount;
                }
                Ordering::Equal => {
                    settle_amount = liquidation_amount;
                    repay_amount = settle_amount.try_ceil_u64()?;
                    withdraw_amount = collateral.deposited_amount;
                }
                Ordering::Less => {
                    let withdraw_pct = liquidation_value.try_div(collateral.market_value)?;
                    settle_amount = liquidation_amount;
                    repay_amount = settle_amount.try_ceil_u64()?;
                    withdraw_amount = Decimal::from(collateral.deposited_amount)
                        .try_mul(withdraw_pct)?
                        .try_floor_u64()?;
                }
            }
        }

        Ok(CalculateLiquidationResult {
            settle_amount,
            repay_amount,
            withdraw_amount,
        })
    }
}


/// Create a new reserve liquidity
pub struct NewReserveLiquidityParams {
    /// Is the mint address a lp
    pub is_lp:bool,
    /// Reserve liquidity mint address
    pub mint_pubkey: Pubkey,
    /// Reserve liquidity mint decimals
    pub mint_decimals: u8,
    /// Reserve liquidity supply address
    pub supply_pubkey: Pubkey,
    /// Reserve liquidity fee receiver address
    pub fee_receiver: Pubkey,
    /// If use pyth oracle
    pub use_pyth_oracle: bool,
    /// Reserve liquidity pyth oracle account when is_lp is false
    /// BridgePool account of bridge program when is_lp is true
    pub params_1: Pubkey,
    /// Reserve liquidity larix oracle account when is_lp is false
    /// LpPrice account of bridge program when is_lp is true
    pub params_2: Pubkey,
    /// Reserve liquidity market price in quote currency
    pub market_price: Decimal,
}

/// Reserve collateral
#[derive(Clone, Debug, Default, PartialEq)]
pub struct ReserveCollateral {
    /// Reserve collateral mint address
    pub mint_pubkey: Pubkey,
    /// Reserve collateral mint supply, used for exchange rate
    pub mint_total_supply: u64,
    /// Reserve collateral supply address
    pub supply_pubkey: Pubkey,
}

impl ReserveCollateral {
    /// Create a new reserve collateral
    pub fn new(params: NewReserveCollateralParams) -> Self {
        Self {
            mint_pubkey: params.mint_pubkey,
            mint_total_supply: 0,
            supply_pubkey: params.supply_pubkey,
        }
    }

    /// Add collateral to total supply
    pub fn mint(&mut self, collateral_amount: u64) -> ProgramResult {
        self.mint_total_supply = self
            .mint_total_supply
            .checked_add(collateral_amount)
            .ok_or(LendingError::MathOverflow)?;
        Ok(())
    }

    /// Remove collateral from total supply
    pub fn burn(&mut self, collateral_amount: u64) -> ProgramResult {
        self.mint_total_supply = self
            .mint_total_supply
            .checked_sub(collateral_amount)
            .ok_or(LendingError::MathOverflow)?;
        Ok(())
    }

    /// Return the current collateral exchange rate.
    fn exchange_rate(
        &self,
        total_liquidity: Decimal,
    ) -> Result<CollateralExchangeRate, ProgramError> {
        let mint_total_supply = Decimal::from(self.mint_total_supply);
        let rate = Rate::try_from(mint_total_supply.try_div(total_liquidity)?)?;

        Ok(CollateralExchangeRate(rate))
    }
}

/// Create a new reserve collateral
pub struct NewReserveCollateralParams {
    /// Reserve collateral mint address
    pub mint_pubkey: Pubkey,
    /// Reserve collateral supply address
    pub supply_pubkey: Pubkey,
}

/// Collateral exchange rate
impl From<CollateralExchangeRate> for Rate {
    fn from(exchange_rate: CollateralExchangeRate) -> Self {
        exchange_rate.0
    }
}
/// Collateral exchange rate
#[derive(Clone, Copy, Debug)]
pub struct CollateralExchangeRate(Rate);

impl CollateralExchangeRate {
    /// Convert reserve collateral to liquidity
    pub fn collateral_to_liquidity(&self, collateral_amount: u64) -> Result<u64, ProgramError> {
        self.decimal_collateral_to_liquidity(collateral_amount.into())?
            .try_floor_u64()
    }

    /// Convert reserve collateral to liquidity
    pub fn decimal_collateral_to_liquidity(
        &self,
        collateral_amount: Decimal,
    ) -> Result<Decimal, ProgramError> {
        collateral_amount.try_div(self.0)
    }

    /// Convert reserve liquidity to collateral
    pub fn liquidity_to_collateral(&self, liquidity_amount: u64) -> Result<u64, ProgramError> {
        self.decimal_liquidity_to_collateral(liquidity_amount.into())?
            .try_floor_u64()
    }

    /// Convert reserve liquidity to collateral
    pub fn decimal_liquidity_to_collateral(
        &self,
        liquidity_amount: Decimal,
    ) -> Result<Decimal, ProgramError> {
        liquidity_amount.try_mul(self.0)
    }
}


#[derive(Clone, Debug, Default, PartialEq,Copy)]
pub struct Bonus {
    /// Supply address of un-collaterized LToken
    pub un_coll_supply_account: Pubkey,
    /// Global mining index of this LToken
    pub l_token_mining_index: Decimal,
    /// Global mining index of borrowing in this reserve
    pub borrow_mining_index: Decimal,

    /// Amount of mine token for this reserve per slot
    pub total_mining_speed: u64,
    /// the critical liquidity utilization rate at which the mine distribution curve jumps
    pub supply_rate: u64,
}
pub struct InitBonusParams {
    pub un_coll_supply_account: Pubkey,
    pub total_mining_speed: u64,
    pub supply_rate: u64,
}

impl Bonus {
    pub fn new(params: InitBonusParams) -> Self {
        Self{
            un_coll_supply_account:params.un_coll_supply_account,
            l_token_mining_index : Decimal::zero(),
            borrow_mining_index : Decimal::zero(),
            total_mining_speed : params.total_mining_speed,
            supply_rate: params.supply_rate,
        }
    }
}

/// Initialize a reserve
pub struct InitReserveParams {
    /// Last slot when supply and rates updated
    pub current_slot: Slot,
    /// Lending market address
    pub lending_market: Pubkey,
    /// Reserve liquidity
    pub liquidity: ReserveLiquidity,
    /// Reserve collateral
    pub collateral: ReserveCollateral,
    /// Reserve configuration values
    pub config: ReserveConfig,
    /// Reserve bonus
    pub bonus: Bonus,
}

/// Reserve configuration values
#[derive(Clone, Debug, Default, PartialEq)]
pub struct ReserveConfig {
    /// Optimal utilization rate, as a percentage
    pub optimal_utilization_rate: u8,
    /// Target ratio of the value of borrows to deposits, as a percentage
    /// 0 if use as collateral is disabled
    pub loan_to_value_ratio: u8,
    /// Bonus a liquidator gets when repaying part of an unhealthy obligation, as a percentage
    pub liquidation_bonus: u8,
    /// Loan to value ratio at which an obligation can be liquidated, as a percentage
    pub liquidation_threshold: u8,
    /// Min borrow APY
    pub min_borrow_rate: u8,
    /// Optimal (utilization) borrow APY
    pub optimal_borrow_rate: u8,
    /// Max borrow APY
    pub max_borrow_rate: u8,
    /// Program owner fees assessed, separate from gains due to interest accrual
    pub fees: ReserveFees,
    /// If deposit paused
    pub deposit_paused:bool,
    /// If borrow paused
    pub borrow_paused:bool,
    /// Id liquidation paused
    pub liquidation_paused:bool,
    /// Deposit limit
    pub deposit_limit:u64,
}

/// Additional fee information on a reserve
///
/// These exist separately from interest accrual fees, and are specifically for the program owner
/// and frontend host. The fees are paid out as a percentage of liquidity token amounts during
/// repayments and liquidations.
#[derive(Clone, Debug, Default, PartialEq)]
pub struct ReserveFees {
    /// Fee assessed on `BorrowObligationLiquidity`, expressed as a Wad.
    /// Must be between 0 and 10^18, such that 10^18 = 1.  A few examples for
    /// clarity:
    /// 1% = 10_000_000_000_000_000
    /// 0.01% (1 basis point) = 100_000_000_000_000
    /// 0.00001% (Aave borrow fee) = 100_000_000_000
    pub borrow_fee_wad: u64,
    pub reserve_owner_fee_wad: u64,
    /// Fee for flash loan, expressed as a Wad.
    /// 0.3% (Aave flash loan fee) = 3_000_000_000_000_000
    pub flash_loan_fee_wad: u64,
    /// Amount of fee going to host account, if provided in liquidate and repay
    pub host_fee_percentage: u8,
    /// Host fee receiver register
    pub host_fee_receivers:Vec<Pubkey>,
}
/// Calculate fees exlusive or inclusive of an amount
pub enum FeeCalculation {
    /// Fee added to amount: fee = rate * amount
    Exclusive,
    /// Fee included in amount: fee = (rate / (1 + rate)) * amount
    Inclusive,
}

impl Sealed for Reserve {}
impl IsInitialized for Reserve {
    fn is_initialized(&self) -> bool {
        self.version != crate::state::UNINITIALIZED_VERSION
    }
}

const RESERVE_LEN: usize = 713 + PUBKEY_BYTES * crate::state::HOST_FEE_RECEIVER_COUNT;//574; // 1 + 8 + 1 + 32 + 32 + 1 + 32 + 32 + 32 + 8 + 16 + 16 + 16 + 32 + 8 + 32 + 1 + 1 + 1 + 1 + 1 + 1 + 1 + 8 + 8 + 1 + 1 +1 +1 +1 248

impl Pack for Reserve {
    const LEN: usize = RESERVE_LEN;

    // @TODO: break this up by reserve / liquidity / collateral / config https://git.io/JOCca
    fn pack_into_slice(&self, output: &mut [u8]) {
        let output = array_mut_ref![output, 0, RESERVE_LEN];
        #[allow(clippy::ptr_offset_with_cast)]
        let (
            version,
            last_update_slot,
            last_update_stale,

            lending_market,
            liquidity_mint_pubkey,
            liquidity_mint_decimals,

            liquidity_supply_pubkey,
            liquidity_fee_receiver,
            liquidity_use_pyth_oracle,
            liquidity_pyth_oracle_pubkey,
            liquidity_larix_oracle_pubkey,

            liquidity_available_amount,
            liquidity_borrowed_amount_wads,
            liquidity_cumulative_borrow_rate_wads,

            liquidity_market_price,
            owner_unclaimed,
            collateral_mint_pubkey,
            collateral_mint_total_supply,

            collateral_supply_pubkey,
            config_optimal_utilization_rate,
            config_loan_to_value_ratio,

            config_liquidation_bonus,
            config_liquidation_threshold,
            config_min_borrow_rate,

            config_optimal_borrow_rate,
            config_max_borrow_rate,
            config_fees_borrow_fee_wad,
            config_fees_reserve_owner_fee_wad,

            config_fees_flash_loan_fee_wad,
            config_fees_host_fee_percentage,
            config_fees_host_fee_receiver_count,
            config_fees_host_fee_receivers,
            deposit_paused,
            borrow_paused,
            liquidation_paused,

            un_coll_supply_account,
            l_token_mining_index,
            borrow_mining_index,

            total_mining_speed,
            supply_rate,
            reentry_lock,
            deposit_limit,
            is_lp,
            _padding,
        ) = mut_array_refs![
            output,
            1,//1
            8,//9
            1,//10
            PUBKEY_BYTES,//42
            PUBKEY_BYTES,//74
            1,//75
            PUBKEY_BYTES,//107
            PUBKEY_BYTES,//139
            1,
            PUBKEY_BYTES,//171
            PUBKEY_BYTES,
            8,//179
            16,//195
            16,//211
            16,//227
            16,
            PUBKEY_BYTES,//259
            8,//268
            PUBKEY_BYTES,//300
            1,//301
            1,//302
            1,//303
            1,//304
            1,//305
            1,//306
            1,//307

            8,//315
            8,

            8,//323

            1,//324
            1,//
            PUBKEY_BYTES * crate::state::HOST_FEE_RECEIVER_COUNT,
            1,//325
            1,//326
            1,//327
            PUBKEY_BYTES,//359
            16,//375
            16,//391
            8,//491
            8,//499
            1,
            8,
            1,
            239
        ];

        // reserve
        *version = self.version.to_le_bytes();
        *last_update_slot = self.last_update.slot.to_le_bytes();
        pack_bool(self.last_update.stale, last_update_stale);
        lending_market.copy_from_slice(self.lending_market.as_ref());

        // liquidity
        liquidity_mint_pubkey.copy_from_slice(self.liquidity.mint_pubkey.as_ref());
        *liquidity_mint_decimals = self.liquidity.mint_decimals.to_le_bytes();
        liquidity_supply_pubkey.copy_from_slice(self.liquidity.supply_pubkey.as_ref());
        liquidity_fee_receiver.copy_from_slice(self.liquidity.fee_receiver.as_ref());
        pack_bool(self.liquidity.use_pyth_oracle, liquidity_use_pyth_oracle);
        liquidity_pyth_oracle_pubkey.copy_from_slice(self.liquidity.pyth_oracle.as_ref());
        liquidity_larix_oracle_pubkey.copy_from_slice(self.liquidity.larix_oracle.as_ref());
        *liquidity_available_amount = self.liquidity.available_amount.to_le_bytes();
        pack_decimal(
            self.liquidity.borrowed_amount_wads,
            liquidity_borrowed_amount_wads,
        );
        pack_decimal(
            self.liquidity.cumulative_borrow_rate_wads,
            liquidity_cumulative_borrow_rate_wads,
        );
        pack_decimal(self.liquidity.market_price, liquidity_market_price);
        pack_bool(self.liquidity.is_lp,is_lp);
        // collateral
        collateral_mint_pubkey.copy_from_slice(self.collateral.mint_pubkey.as_ref());
        *collateral_mint_total_supply = self.collateral.mint_total_supply.to_le_bytes();
        collateral_supply_pubkey.copy_from_slice(self.collateral.supply_pubkey.as_ref());

        // config
        *config_optimal_utilization_rate = self.config.optimal_utilization_rate.to_le_bytes();
        *config_loan_to_value_ratio = self.config.loan_to_value_ratio.to_le_bytes();
        *config_liquidation_bonus = self.config.liquidation_bonus.to_le_bytes();
        *config_liquidation_threshold = self.config.liquidation_threshold.to_le_bytes();
        *config_min_borrow_rate = self.config.min_borrow_rate.to_le_bytes();
        *config_optimal_borrow_rate = self.config.optimal_borrow_rate.to_le_bytes();
        *config_max_borrow_rate = self.config.max_borrow_rate.to_le_bytes();
        *config_fees_borrow_fee_wad = self.config.fees.borrow_fee_wad.to_le_bytes();
        *config_fees_reserve_owner_fee_wad = self.config.fees.reserve_owner_fee_wad.to_le_bytes();
        *config_fees_flash_loan_fee_wad = self.config.fees.flash_loan_fee_wad.to_le_bytes();
        *config_fees_host_fee_percentage = self.config.fees.host_fee_percentage.to_le_bytes();
        *config_fees_host_fee_receiver_count = u8::try_from(self.config.fees.host_fee_receivers.len()).unwrap().to_le_bytes();

        let mut offset = 0;
        for host_fee_receiver in &self.config.fees.host_fee_receivers {
            let host_fee_receiver_id = array_mut_ref![config_fees_host_fee_receivers, offset,PUBKEY_BYTES];
            host_fee_receiver_id.copy_from_slice(host_fee_receiver.as_ref());
            offset += PUBKEY_BYTES;
        }

        pack_bool(self.config.deposit_paused, deposit_paused);
        pack_bool(self.config.borrow_paused, borrow_paused);
        pack_bool(self.config.liquidation_paused, liquidation_paused);
        *deposit_limit = self.config.deposit_limit.to_le_bytes();

        un_coll_supply_account.copy_from_slice(self.bonus.un_coll_supply_account.as_ref());
        pack_decimal(self.bonus.l_token_mining_index, l_token_mining_index);
        pack_decimal(self.bonus.borrow_mining_index, borrow_mining_index);

        *total_mining_speed = self.bonus.total_mining_speed.to_le_bytes();
        *supply_rate = self.bonus.supply_rate.to_le_bytes();
        pack_decimal(self.liquidity.owner_unclaimed, owner_unclaimed);
        pack_bool(self.reentry_lock, reentry_lock);
    }

    /// Unpacks a byte buffer into a [ReserveInfo](struct.ReserveInfo.html).
    fn unpack_from_slice(input: &[u8]) -> Result<Self, ProgramError> {
        let input = array_ref![input, 0, RESERVE_LEN];
        #[allow(clippy::ptr_offset_with_cast)]
        let (
            version,
            last_update_slot,
            last_update_stale,
            lending_market,
            liquidity_mint_pubkey,
            liquidity_mint_decimals,
            liquidity_supply_pubkey,
            liquidity_fee_receiver,
            liquidity_use_pyth_oracle,
            liquidity_pyth_oracle_pubkey,
            liquidity_larix_oracle_pubkey,
            liquidity_available_amount,
            liquidity_borrowed_amount_wads,
            liquidity_cumulative_borrow_rate_wads,
            liquidity_market_price,
            owner_unclaimed,
            collateral_mint_pubkey,
            collateral_mint_total_supply,
            collateral_supply_pubkey,
            config_optimal_utilization_rate,
            config_loan_to_value_ratio,
            config_liquidation_bonus,
            config_liquidation_threshold,
            config_min_borrow_rate,
            config_optimal_borrow_rate,
            config_max_borrow_rate,
            config_fees_borrow_fee_wad,
            config_fees_reserve_owner_fee_wad,
            config_fees_flash_loan_fee_wad,
            config_fees_host_fee_percentage,
            config_fees_host_fee_receiver_count,
            config_fees_host_fee_receivers,
            deposit_paused,
            borrow_paused,
            liquidation_paused,
            un_coll_supply_account,
            l_token_mining_index,
            borrow_mining_index,
            total_mining_speed,
            supply_rate,
            reentry_lock,
            deposit_limit,
            is_lp,
            _padding,
        ) = array_refs![
            input,
            1,
            8,
            1,
            PUBKEY_BYTES,
            PUBKEY_BYTES,
            1,
            PUBKEY_BYTES,
            PUBKEY_BYTES,
            1,
            PUBKEY_BYTES,
            PUBKEY_BYTES,
            8,
            16,
            16,
            16,
            16,
            PUBKEY_BYTES,
            8,
            PUBKEY_BYTES,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            8,
            8,
            8,
            1,
            1,//
            PUBKEY_BYTES * HOST_FEE_RECEIVER_COUNT,
            1,
            1,
            1,
            PUBKEY_BYTES,
            16,
            16,
            8,
            8,
            1,
            8,
            1,
            239
        ];

        let version = u8::from_le_bytes(*version);
        if version > PROGRAM_VERSION {
            msg!("Reserve version does not match lending program version");
            return Err(ProgramError::InvalidAccountData);
        }
        let host_fee_receiver_count = u8::from_le_bytes(*config_fees_host_fee_receiver_count);
        let mut host_fee_receivers = Vec::with_capacity(host_fee_receiver_count as usize + 1);
        let offset = 0;
        for _ in 0..host_fee_receiver_count{
            let host_fee_receiver = array_ref![config_fees_host_fee_receivers, offset, PUBKEY_BYTES];
            host_fee_receivers.push(Pubkey::new(host_fee_receiver));
        }
        Ok(Self {
            version,
            last_update: LastUpdate {
                slot: u64::from_le_bytes(*last_update_slot),
                stale: unpack_bool(last_update_stale)?,
            },
            lending_market: Pubkey::new_from_array(*lending_market),
            liquidity: ReserveLiquidity {
                is_lp: unpack_bool(is_lp)?,
                mint_pubkey: Pubkey::new_from_array(*liquidity_mint_pubkey),
                mint_decimals: u8::from_le_bytes(*liquidity_mint_decimals),
                supply_pubkey: Pubkey::new_from_array(*liquidity_supply_pubkey),
                fee_receiver: Pubkey::new_from_array(*liquidity_fee_receiver),
                use_pyth_oracle: unpack_bool(liquidity_use_pyth_oracle)?,
                pyth_oracle: Pubkey::new_from_array(*liquidity_pyth_oracle_pubkey),
                larix_oracle: Pubkey::new_from_array(*liquidity_larix_oracle_pubkey),
                available_amount: u64::from_le_bytes(*liquidity_available_amount),
                borrowed_amount_wads: unpack_decimal(liquidity_borrowed_amount_wads),
                cumulative_borrow_rate_wads: unpack_decimal(liquidity_cumulative_borrow_rate_wads),
                market_price: unpack_decimal(liquidity_market_price),
                owner_unclaimed: unpack_decimal(owner_unclaimed),
            },
            collateral: ReserveCollateral {
                mint_pubkey: Pubkey::new_from_array(*collateral_mint_pubkey),
                mint_total_supply: u64::from_le_bytes(*collateral_mint_total_supply),
                supply_pubkey: Pubkey::new_from_array(*collateral_supply_pubkey),
            },
            config: ReserveConfig {
                optimal_utilization_rate: u8::from_le_bytes(*config_optimal_utilization_rate),
                loan_to_value_ratio: u8::from_le_bytes(*config_loan_to_value_ratio),
                liquidation_bonus: u8::from_le_bytes(*config_liquidation_bonus),
                liquidation_threshold: u8::from_le_bytes(*config_liquidation_threshold),
                min_borrow_rate: u8::from_le_bytes(*config_min_borrow_rate),
                optimal_borrow_rate: u8::from_le_bytes(*config_optimal_borrow_rate),
                max_borrow_rate: u8::from_le_bytes(*config_max_borrow_rate),
                fees: ReserveFees {
                    borrow_fee_wad: u64::from_le_bytes(*config_fees_borrow_fee_wad),
                    reserve_owner_fee_wad: u64::from_le_bytes(*config_fees_reserve_owner_fee_wad),
                    flash_loan_fee_wad: u64::from_le_bytes(*config_fees_flash_loan_fee_wad),
                    host_fee_percentage: u8::from_le_bytes(*config_fees_host_fee_percentage),
                    host_fee_receivers,
                },
                deposit_paused:unpack_bool(deposit_paused)?,
                borrow_paused:unpack_bool(borrow_paused)?,
                liquidation_paused:unpack_bool(liquidation_paused)?,
                deposit_limit:u64::from_le_bytes(*deposit_limit),
            },
            bonus: Bonus{
                un_coll_supply_account: Pubkey::new_from_array(*un_coll_supply_account),
                l_token_mining_index: unpack_decimal(l_token_mining_index),
                borrow_mining_index: unpack_decimal(borrow_mining_index),
                total_mining_speed: u64::from_le_bytes(*total_mining_speed),
                supply_rate: u64::from_le_bytes(*supply_rate)
            },
            reentry_lock:unpack_bool(reentry_lock)?,
        })
    }
}
