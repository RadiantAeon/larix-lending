import {
    Detail,
    redeemReserveCollateralInstruction,
    Reserve,
} from "../../models";
import {
    BRIDGE_POOL_PROGRAM_ID,
    LENDING_PROGRAM_ID
} from "../../constants/config"
import {
    Account, Connection,
    PublicKey, Signer,
    TransactionInstruction,
} from '@solana/web3.js';
import BN from "bn.js";
import {refreshReserve} from "./refreshReserve";

// @FIXME
/**
 *
 * @param source in collateral
 * @param collateralAmount
 * @param wallet
 * @param reserve
 * @param reserveAddress
 * @param destinationLiquidity
 */
export const redeemReserveCollateral = async (
    connection: Connection,
    signers: Signer[],
    instructions: TransactionInstruction[],
    cleanupInstructions: TransactionInstruction[],
    sourceCollateral: PublicKey,
    collateralAmount: BN,
    wallet: any,
    detailReserve: Detail<Reserve>,
    destinationLiquidity: PublicKey,
    withdrawLpAccount:PublicKey|undefined
) => {
    const reserve = detailReserve.info
    const reserveAddress = detailReserve.pubkey

    const [lendingMarketAuthority] = await PublicKey.findProgramAddress(
        [reserve.lendingMarket.toBuffer()], // which account should be authority
        LENDING_PROGRAM_ID,
    );

    await refreshReserve(
        connection,
        signers,
        instructions,
        cleanupInstructions,
        detailReserve
    )

    instructions.push(
        redeemReserveCollateralInstruction(
            collateralAmount,
            sourceCollateral,
            destinationLiquidity,
            reserveAddress,
            reserve.collateral.mintPubkey,
            reserve.liquidity.supplyPubkey,
            reserve.lendingMarket,
            lendingMarketAuthority,
            wallet.publicKey,
            reserve.isLP,
            reserve.liquidity.params_1,
            BRIDGE_POOL_PROGRAM_ID,
            withdrawLpAccount
        ),
    );

};
