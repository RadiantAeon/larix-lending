import {Connection, PublicKey, SYSVAR_CLOCK_PUBKEY} from "@solana/web3.js";
import {
    LendingMarket,
    Reserve,
    ReserveParser,
    Detail,
    TokenAccountParser,
    isReserve,
    LpInfo,
    LpConfig, TokenAccount
} from "../models";
import {getConnection} from "../context/connection";
import {
    ALL_IDS,
    RESERVE_IDS,
    RESERVE_LARIX_ORACLES,
    RESERVE_NAMES,
    RESERVE_FULLNAMES,
    LP_RESERVE_IDS,
    RESERVE_IDS_LENGTH,
    SINGLE_LP_RESERVE_IDS_LENGTH,
    LP_TOKEN_LENGTH,
    LP_CONFIG_LENGTH,
    LARIX_USDC_POOL,
    LARIX_USDC_CONFIG_LENGTH
} from "@/api/constants/config";
import BN from "bn.js";
import BigNumber from "bignumber.js";
import {getMineRatio, getUtilizationRate} from "@/api/utils/calculateAllMine";
import {BIG_NUMBER_WAD, ZERO} from "@/api/constants/math";
import {SLOTS_PER_YEAR,REAL_SLOTS_PER_YEAR} from "@/api/constants/math";
import {LP_REWARD_TOKEN} from "@/api/constants/config"
import {BIG_NUMBER_ONE, BIG_NUMBER_ZERO, eX} from "@/utils/helpers";
import {MarketPrice, PriceParser} from "@/api/models/state/marketPrice";
import {Amm, AmmParser} from "@/api/models/state/lp-price/amm";
import {MintParser} from "@/api/models/state/mint";
import {AmmOpenOrders, AmmOpenOrdersLayoutParser} from "@/api/models/state/lp-price/ammOpenOrders";
import {FarmPoolParser, STAKE_INFO_LAYOUT, STAKE_INFO_LAYOUT_V4} from "../models/state/lp-price/farmPool";
import {MintInfo} from "@solana/spl-token";
import {FarmLedgerParser} from "@/api/models/state/lp-price/farmLedger";
let lastSlot:number = 0
let firstQuery = true



export async function getLendingReserve(){
    const reserveArrayInner = new Array<Detail<Reserve>>();
    const marketPriceArray = new Array<Detail<MarketPrice>>();

    const connection = await getConnection()
    // @ts-ignore
    const result = await Promise.all(
        [
            getSlot(connection),
            getAllLendingReserveAndMarketPrice(connection,reserveArrayInner),
        ]
        )
    ;
    const mineCollateralLp = result[1] as any
    lastSlot = lastSlot < result[0]?result[0]:lastSlot;
    const currentSlot = new BN(lastSlot)
    accrueInterest(reserveArrayInner,currentSlot)
    refreshIndex(reserveArrayInner,currentSlot)
    refreshExchangeRate(reserveArrayInner)
    refreshMineCollateralLp(mineCollateralLp,lastSlot)
    firstQuery = false
    return {reserveArrayInner:reserveArrayInner,mineCollateralLp:mineCollateralLp}
}
function refreshMineCollateralLp(mineCollateralLp: any, currentSlot: number) {
    const rewardInfo = mineCollateralLp.rewardInfo
    const farmLpInfo = mineCollateralLp.farmLpInfo
    const totalIncrease = new BigNumber(rewardInfo.info.perBlockB.toString()).times(currentSlot - rewardInfo.info.lastBlock.toNumber());
    const totalLpAmount = new BigNumber(farmLpInfo.info.amount.toString())
    const increasePerShare = totalIncrease.div(totalLpAmount)
    rewardInfo.info.perShareB = rewardInfo.info.perShareB.add(new BN(eX(increasePerShare.toString(),15).toFixed(0)))
}
function refreshExchangeRate(allReserve:Detail<Reserve>[]) {
    allReserve.map((reserve)=> {
        const info = reserve.info
        const decimals = info.liquidity.mintDecimals
        let totalBorrowedAmount = eX(info.liquidity.borrowedAmountWads.toString(), -18)
        if (totalBorrowedAmount.lt(BIG_NUMBER_ONE)) {
            totalBorrowedAmount = BIG_NUMBER_ZERO
        } else {
            totalBorrowedAmount = totalBorrowedAmount.div(10**decimals)
        }
        const totalLiquidityAmount = new BigNumber(eX(info.liquidity.availableAmount.toString(), -decimals)).plus(totalBorrowedAmount).minus(eX(info.liquidity.ownerUnclaimed.toString(), -18 - decimals))
        info.liquidity.liquidityPrice = eX(info.liquidity.marketPrice.toString() || "0", -18)
        const mintTotalSupply = eX(info.collateral.mintTotalSupply.toString(), -1 * Number(decimals))
        if (mintTotalSupply.isZero() || totalLiquidityAmount.isZero()) {
            info.liquidity.exchangeRate = BIG_NUMBER_ONE
        } else {
            info.liquidity.exchangeRate = mintTotalSupply.div(totalLiquidityAmount)
        }
    })
}
async function getAllLendingReserveAndMarketPrice(connection:Connection,reserveArrayInner:Array<Detail<Reserve>>){
    const res = await Promise.all(
        [
            connection.getMultipleAccountsInfo(ALL_IDS.slice(0,100)),
            connection.getMultipleAccountsInfo(ALL_IDS.slice(100,ALL_IDS.length))
        ]
    )
    const accounts = res[0].concat(res[1])
    const reserveAccounts = accounts.slice(0,RESERVE_IDS.length)
    const marketPriceAccounts = accounts.slice(RESERVE_IDS.length,RESERVE_IDS.length * 2)
    const lpReserves = accounts.slice(RESERVE_IDS.length * 2, ALL_IDS.length-LARIX_USDC_CONFIG_LENGTH)
    const larix_usdc_pool = accounts.slice(ALL_IDS.length-LARIX_USDC_CONFIG_LENGTH,ALL_IDS.length)
    for (let i=0;i<reserveAccounts.length;i++){
        const reserveAccountInfo = reserveAccounts[i]
        const marketPriceAccountInfo = marketPriceAccounts[i]
        if (reserveAccountInfo!==null && marketPriceAccountInfo!==null){
            //@ts-ignore
            const reserve = ReserveParser(RESERVE_IDS[i],reserveAccountInfo)
            reserve.info.liquidity.name = RESERVE_NAMES[i]
            reserve.info.liquidity.fullName = RESERVE_FULLNAMES[i]
            //@ts-ignore
            const marketPrice = PriceParser(RESERVE_LARIX_ORACLES[i],marketPriceAccountInfo)
            reserve.info.liquidity.marketPrice = marketPrice.info.price.mul(
                new BN(10)
                    .pow(
                        new BN(18-marketPrice.info.expo)
                    )
            )
            if (firstQuery){
                console.log(RESERVE_NAMES[i]+":",eX( reserve.info.liquidity.marketPrice.toString(),-18).toFixed(4))
            }
            reserveArrayInner.push(reserve)
        }
    }
    for (let i=0;i<LP_RESERVE_IDS.length;i+=1){
        const lpConfig = LP_RESERVE_IDS[i]
        //@ts-ignore
        const reserve = ReserveParser(lpConfig.reserveID,lpReserves[i*LP_CONFIG_LENGTH])
        //@ts-ignore
        const amm = AmmParser(lpConfig.ammID,lpReserves[i*LP_CONFIG_LENGTH+1])
        //@ts-ignore
        const lpMint = MintParser(lpConfig.lpMint,lpReserves[i*LP_CONFIG_LENGTH+2])
        //@ts-ignore
        const coinMintPrice = PriceParser(lpConfig.coinMintPrice,lpReserves[i*LP_CONFIG_LENGTH+3])
        //@ts-ignore
        const pcMintPrice = PriceParser(lpConfig.pcMintPrice,lpReserves[i*LP_CONFIG_LENGTH+4])
        //@ts-ignore
        const ammOpenOrders = AmmOpenOrdersLayoutParser(lpConfig.ammOpenOrders,lpReserves[i*LP_CONFIG_LENGTH+5])
        //@ts-ignore
        const ammCoinMint = TokenAccountParser(lpConfig.ammCoinMintSupply,lpReserves[i*LP_CONFIG_LENGTH+6])
        //@ts-ignore
        const ammPcMint = TokenAccountParser(lpConfig.ammPcMintSupply,lpReserves[i*LP_CONFIG_LENGTH+7])
        //@ts-ignore
        const poolInfo = FarmPoolParser(lpConfig.farmPoolID,lpReserves[i*LP_CONFIG_LENGTH+8])
        //@ts-ignore
        const farmPoolLpToken =  TokenAccountParser(lpConfig.farmPoolLpSupply,lpReserves[i*LP_CONFIG_LENGTH+9])

        reserve.info.liquidity.name = lpConfig.name
        reserve.info.liquidity.fullName = lpConfig.fullName

        const lpPrice = getLpPrice(amm, ammOpenOrders,ammCoinMint,ammPcMint,coinMintPrice,pcMintPrice,lpMint)
        reserve.info.liquidity.marketPrice = eX(lpPrice,18)

        reserve.info.lpInfo = getLpInfo(reserve,lpConfig,poolInfo,lpMint,farmPoolLpToken)

        if (firstQuery){
            console.log(reserve.info.liquidity.name+":",eX(reserve.info.liquidity.marketPrice.toString(),-18).toFixed(4))
        }
        reserveArrayInner.push(reserve)
    }
    //
    return getLarixStakePoolInfo(larix_usdc_pool)
}
const getLarixStakePoolInfo = (
    larix_usdc_pool:any,
)=>{
    const amm = AmmParser(LARIX_USDC_POOL.amm_Id,larix_usdc_pool[2])
    const ammOpenOrders = AmmOpenOrdersLayoutParser(LARIX_USDC_POOL.ammOpenOrders,larix_usdc_pool[3])
    const ammCoinMint = TokenAccountParser(LARIX_USDC_POOL.ammCoinMintSupply,larix_usdc_pool[4])
    const ammPcMint = TokenAccountParser(LARIX_USDC_POOL.ammPcMintSupply,larix_usdc_pool[5])
    const totalAmount = getTotalAmount(amm,ammOpenOrders,ammCoinMint,ammPcMint)
    const price = new BigNumber(totalAmount.pcTotalAmount).div(totalAmount.coinTotalAmount)
    return {
        rewardInfo:FarmPoolParser(LARIX_USDC_POOL.farmPoolID,larix_usdc_pool[0]),
        farmLpInfo:TokenAccountParser(LARIX_USDC_POOL.farmPoolLpSupply,larix_usdc_pool[1]),
        farmLedger:FarmLedgerParser(LARIX_USDC_POOL.farmLedger,larix_usdc_pool[6]),
        price:price
    }
}
function getTotalAmount(
    amm:Detail<Amm>,
    ammOpenOrders:Detail<AmmOpenOrders>,
    ammCoinMint:TokenAccount,
    ammPcMint:TokenAccount,
){
    const coinTotalAmount = eX(
        ammCoinMint.info.amount.add(ammOpenOrders.info.baseTokenTotal).sub(amm.info.needTakePnlCoin).toString(),
        -amm.info.coinDecimals.toNumber()
    )
    const pcTotalAmount = eX(
        ammPcMint.info.amount.add(ammOpenOrders.info.quoteTokenTotal).sub(amm.info.needTakePnlPc).toString(),
        -amm.info.pcDecimals.toNumber()
    )
    return {
        coinTotalAmount:coinTotalAmount,
        pcTotalAmount:pcTotalAmount,
    }
}
function getLpPrice(
    amm:Detail<Amm>,
    ammOpenOrders:Detail<AmmOpenOrders>,
    ammCoinMint:TokenAccount,
    ammPcMint:TokenAccount,
    coinMintPrice:Detail<MarketPrice>,
    pcMintPrice:Detail<MarketPrice>,
    lpMint:Detail<MintInfo>){
    const totalAmount = getTotalAmount(amm,ammOpenOrders,ammCoinMint,ammPcMint)
    const coinTotalAmount = totalAmount.coinTotalAmount
    const pcTotalAmount = totalAmount.pcTotalAmount
    const coinPrice = eX(coinMintPrice.info.price.toString(),-coinMintPrice.info.expo)
    const pcPrice = eX(pcMintPrice.info.price.toString(),-pcMintPrice.info.expo)
    const lpTotalSupplyAmount = eX(lpMint.info.supply.toString(),-lpMint.info.decimals)
    return (2 * Math.sqrt(coinTotalAmount.times(coinPrice).toNumber())*Math.sqrt(pcTotalAmount.times(pcPrice).toNumber()))/lpTotalSupplyAmount.toNumber()
}
function getLpInfo(reserve:Detail<Reserve>,lpConfig:LpConfig,poolInfo:Detail<any>,lpMint:Detail<MintInfo>,farmPoolLpToken:TokenAccount){
    const lpInfo ={} as LpInfo
    // @ts-ignore
    lpInfo.rewardASymbol = LP_REWARD_TOKEN[reserve.info.liquidity.name].rewardA
    // @ts-ignore
    lpInfo.rewardBSymbol = LP_REWARD_TOKEN[reserve.info.liquidity.name].rewardB
    if ([4,5].includes(lpConfig.version)) {
        lpInfo.perBlock = new BigNumber(poolInfo.info.perBlock)
        lpInfo.perBlockB = new BigNumber(poolInfo.info.perBlockB)
    }else {
        lpInfo.perBlock = new BigNumber(0)
        lpInfo.perBlockB = new BigNumber(poolInfo.info.rewardPerBlock)
    }
    lpInfo.farmPoolLpSupply = eX(farmPoolLpToken.info.amount.toString(),-lpMint.info.decimals)
    lpInfo.amm_id = lpConfig.ammID
    return lpInfo
}
async function getSlot(connection:Connection){
    // The level of commitment desired when querying state
    // 'processed': Query the most recent block which has reached 1 confirmation by the connected node
    // 'confirmed': Query the most recent block which has reached 1 confirmation by the cluster
    // 'finalized': Query the most recent block which has been finalized by the cluster
    return await connection.getSlot("processed")
}
async function getSlots(connection:Connection){
    const clockAccountInfo = await connection.getAccountInfo(SYSVAR_CLOCK_PUBKEY)
}
function refreshIndex(allReserve:Detail<Reserve>[],currentSlot:BN){
    allReserve.map((reserve)=>{
        const slotDiff = currentSlot.sub(reserve.info.lastUpdate.slot)
        const {lTokenMiningRatio,borrowMiningRatio} = getMineRatio(reserve.info)
        const slotDiffTotalMining = new BigNumber(reserve.info.bonus.totalMiningSpeed.toString()).times(new BigNumber(slotDiff.toString()))
        if (!lTokenMiningRatio.eq(0)){
            if (reserve.info.collateral.mintTotalSupply.cmp(ZERO)!==0){
                const plus = slotDiffTotalMining.times(lTokenMiningRatio).div(new BigNumber(reserve.info.collateral.mintTotalSupply.toString())).times(BIG_NUMBER_WAD)

                const newIndex = new BigNumber(reserve.info.bonus.lTokenMiningIndex.toString()).plus(
                    plus
                ).toString()

                reserve.info.bonus.lTokenMiningIndex = new BN(newIndex.split(".")[0])
            }
        }
        if (!borrowMiningRatio.eq(0)){
            if (reserve.info.liquidity.borrowedAmountWads.cmp(ZERO)!==0){
                const newIndex = new BigNumber(reserve.info.bonus.borrowMiningIndex.toString()).plus(
                    slotDiffTotalMining.times(borrowMiningRatio).div(
                        new BigNumber(reserve.info.liquidity.borrowedAmountWads.toString()).div(BIG_NUMBER_WAD).div(eX(reserve.info.liquidity.cumulativeBorrowRateWads.toString(),-18))
                    ).times(BIG_NUMBER_WAD)
                )
                reserve.info.bonus.borrowMiningIndex = new BN(newIndex.toFixed(0))
            }
        }
    })
}
function accrueInterest(allReserve:Detail<Reserve>[],currentSlot:BN){
    allReserve.map((reserve)=>{
        const slotDiff = currentSlot.sub(reserve.info.lastUpdate.slot)
        const utilizationRate = getUtilizationRate(reserve.info)
        const currentBorrowRate = getCurrentBorrowRate(reserve.info ,utilizationRate)
        const slotInterestRate = currentBorrowRate.div(SLOTS_PER_YEAR)
        const compoundedInterestRate = new BigNumber(slotInterestRate.plus(1).pow(slotDiff.toNumber()))
        if (reserve.info.isLP) {
            reserve.info.config.borrowYearCompoundedInterestRate = new BigNumber(0)
            reserve.info.config.supplyYearCompoundedInterestRate = new BigNumber(0)
        }else {
            reserve.info.config.borrowYearCompoundedInterestRate = new BigNumber(slotInterestRate.plus(1).toNumber()**REAL_SLOTS_PER_YEAR).minus(1)
            reserve.info.config.supplyYearCompoundedInterestRate = reserve.info.config.borrowYearCompoundedInterestRate.times(0.8).times(utilizationRate)
        }
        reserve.info.liquidity.cumulativeBorrowRateWads =
            new BN(new BigNumber(reserve.info.liquidity.cumulativeBorrowRateWads.toString()).times(compoundedInterestRate).toFixed(0))
        const newUnclaimed =
            new BN(
                new BigNumber(reserve.info.liquidity.borrowedAmountWads.toString())
                    .times(compoundedInterestRate.minus(1))
                    .times(
                        new BigNumber(reserve.info.config.fees.borrowInterestFeeWad.toString()).div(BIG_NUMBER_WAD))
                    .toFixed(0)
            )

        reserve.info.liquidity.ownerUnclaimed = reserve.info.liquidity.ownerUnclaimed.add(newUnclaimed)
        reserve.info.liquidity.borrowedAmountWads =
            new BN(new BigNumber(reserve.info.liquidity.borrowedAmountWads.toString()).times(compoundedInterestRate).toFixed(0))
    })
}

function getCurrentBorrowRate(reserve:Reserve,utilizationRate:BigNumber):BigNumber{

    const optimalUtilizationRate = new BigNumber(reserve.config.optimalUtilizationRate).div(100)
    const lowUtilization = utilizationRate.lt(optimalUtilizationRate)
    if (lowUtilization || optimalUtilizationRate.eq(1)){
        const normalizedRate = utilizationRate.div(optimalUtilizationRate)
        const minRate = new BigNumber(reserve.config.minBorrowRate).div(100)
        const rateRange = new BigNumber(reserve.config.optimalBorrowRate-reserve.config.minBorrowRate).div(100)
        return normalizedRate.times(rateRange).plus(minRate)
    } else {
        const normalizedRate = utilizationRate.minus(optimalUtilizationRate).div(new BigNumber(1).minus(optimalUtilizationRate))
        const minRate = reserve.config.optimalBorrowRate/100
        const rateRange = new BigNumber(reserve.config.maxBorrowRate-reserve.config.optimalBorrowRate).div(100)
        return normalizedRate.times(rateRange).plus(minRate)
    }
}

async function getLendingReserveByKey(connection:Connection,reserveKey:PublicKey,name:string,reserveArrayInner:Array<Detail<Reserve>>,marketPriceArray:Array<Detail<MarketPrice>>){
    const reserveAccountInfo = await connection.getAccountInfo(reserveKey)
    if (reserveAccountInfo==null){
        throw new Error("reserveAccountInfo is null")
    }
    // console.log("reserveAccountInfo",reserveAccountInfo)
    const reserve = ReserveParser(reserveKey,reserveAccountInfo)
    reserve.info.liquidity.name = name
    reserveArrayInner.push(reserve)
    marketPriceArray.map((marketPrice) => {
        if (reserve.info.liquidity.params_2.equals(marketPrice.pubkey)){
            reserve.info.liquidity.marketPrice = marketPrice.info.price.mul(
                new BN(10)
                    .pow(
                        new BN(18-marketPrice.info.expo)
                        // .sub(marketPrice.info.expo)
                    )
            )
        }
    })
    return 0
}
async function getMarketPrice(connection:Connection,index:number,reserveArrayInner:Array<Detail<Reserve>>,marketPriceArray:Array<Detail<MarketPrice>>){
    const marketPriceInfoInOracle = await connection.getAccountInfo(RESERVE_LARIX_ORACLES[index])
    if (marketPriceInfoInOracle==null){
        throw new Error("reserveAccountInfo is null")
    }
    const marketPrice = PriceParser(RESERVE_LARIX_ORACLES[index],marketPriceInfoInOracle)
    marketPriceArray.push(marketPrice)
    reserveArrayInner.map((reserve)=>{
        if (reserve.info.liquidity.params_2.equals(marketPrice.pubkey)){
            reserve.info.liquidity.marketPrice = marketPrice.info.price.mul(
                new BN(10)
                    .pow(
                        new BN(18-marketPrice.info.expo)
                    )
            )
        }
    })
    return 0
}

