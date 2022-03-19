import store from '../store'
const BigNumber = require("bignumber.js");
BigNumber.config({EXPONENTIAL_AT: 1e9});
import appController from '@/controller/dataErrorController'
import getDetailService from "@/api/services/getDetailService";
import {getLendingMarket,getLendingMarketLocal} from "@/api/provider/lendingMarketProvider";
import {getLendingReserve} from "@/api/provider/lendingReserveProvider";
import {getTokenAccounts} from "@/api/provider/tokenAccountsProvider";
import {getObligation} from "@/api/provider/obligationProvider";
import {getMining} from "@/api/provider/miningProvider"
import {getInterest} from '../api/utils/rateModel'
import {getMineRatio} from "@/api/utils/calculateAllMine"

import {Detail, Obligation, ObligationCollateral, Reserve, TokenAccount} from "@/api/models";
// @ts-ignore
import {BIG_NUMBER_ONE, BIG_NUMBER_ZERO, eX, TOTAL_LARIX_DAILY} from "@/utils/helpers";
import {getWallet} from "@/api/context/wallet";
import {Mining} from "@/api/models/state/mining";
import {calculateAllMine} from "@/api/utils/calculateAllMine";
import {IEO_LARIX_AMOUNT, REAL_SLOTS_PER_DAY} from '@/api/constants/math';
import { LARIX_USDC_POOL, LP_REWARD_TOKEN, SORT_WEIGHT} from "@/api/constants/config"
import { withdrawLpAccountProviderByOwner } from '@/api/provider/withdrawLpAccountProvider';
import { WithdrawLpAccount } from '@/api/models/state/withdrawLpAccount';
import {LpFeeApyProvider, LpApyProvider } from '@/api/provider/lpApyProvider';
import {DoubleReward} from "@/data/doubleReward";
import { getPositionsByOwner } from '@/api/provider/positionProvider';
import {Position} from "@/api/models/state/position";
import { getUserFeeLarixInfoByOwner } from '@/api/provider/userLarixInfoProvider';
import {getLarixLockPool} from "@/api/context/larixLock";


async function getReserveData(reserveDetail:Detail<Reserve>, wallet:any, userAllTokenAccounts: Map<string,Array<TokenAccount>>, userAllObligations: Array<Detail<Obligation>>,userAllMining:Detail<Mining>[],userObligationIndex:number) {
    const info = reserveDetail.info
    const liquidityMintPubkey = info.liquidity.mintPubkey.toString()
    const collateralMintPubkey = info.collateral.mintPubkey.toString()
    // TODO: 考虑多个账户
    const userLiquidityTokenAccount = userAllTokenAccounts.get(liquidityMintPubkey)?.[0]
    const userCollateralTokenAccount = userAllTokenAccounts.get(collateralMintPubkey)?.[0]
    const borrowTokenAccount = userLiquidityTokenAccount
    const userObligation = userAllObligations?.[userObligationIndex]
    const mining = userAllMining?.[0]
    const symbol = info.liquidity.name
    const isLP = info.isLP
    const lpInfo = info.lpInfo
    // @ts-ignore
    const fullName = info.liquidity.fullName
    const tokenName = info.liquidity.mintPubkey.toBase58()
    const liquidityPrice = eX(info.liquidity.marketPrice.toString()||"0",-18)
    const decimals = info.liquidity.mintDecimals
    const walletBalanceInTokenUnit = eX(userLiquidityTokenAccount?.info.amount.toString()||'0',-1*Number(decimals))
    const walletBalance = walletBalanceInTokenUnit.times(liquidityPrice)
    const isEnterMarket = userObligation?.info.deposits.filter(liquidity=>liquidity.depositReserve.equals(reserveDetail.pubkey)).length>0
    const liquidationThreshold = info.config.liquidationThreshold / 100
    let miningSupplyAmount = eX(
        mining?.info.miningIndices.filter(
            miningIndex=>miningIndex.reserve.equals(reserveDetail.pubkey)
        )[0]?.unCollLTokenAmount.toString()||'0',

        -1*Number(decimals)
    )
    const depositAmount = eX(
        userObligation?.info.deposits.filter(
            liquidity => liquidity.depositReserve.equals(reserveDetail.pubkey)
        )[0]?.depositedAmount.toString() || '0',
        -1 * Number(decimals)
    )
    if (miningSupplyAmount.isGreaterThan(0)&&depositAmount.isGreaterThan(0)){
        if (isEnterMarket&&depositAmount.isGreaterThan(0)){
            miningSupplyAmount = new BigNumber(0)
        }
    }
    const collateralTokenBalanceInTokenUnit = miningSupplyAmount.plus(depositAmount)
    const reserveCumulativeBorrowRateWads = eX(info.liquidity.cumulativeBorrowRateWads.toString(),-(18))
    let userCumulativeBorrowRateWads = new BigNumber(userObligation?.info.borrows.filter(item =>{
        return item.borrowReserve.equals(reserveDetail.pubkey)
    })[0]?.cumulativeBorrowRateWads)
    userCumulativeBorrowRateWads = (!userCumulativeBorrowRateWads.isNaN()?eX(userCumulativeBorrowRateWads.toString(),-(18)):new BigNumber(0))
    // @ts-ignore
    const borrowInterestFee = eX(info.config.fees.borrowInterestFeeWad.toString(),-18)

    const totalAvailable = new BigNumber(info.liquidity.availableAmount.toString()).minus(eX(info.liquidity.ownerUnclaimed.toString(),-18)).toString()
    const totalAvailableAmount = totalAvailable.startsWith("-")?BIG_NUMBER_ZERO:eX(totalAvailable,-Number(decimals))

    const compoundedInterestRate = userCumulativeBorrowRateWads.isZero()?new BigNumber(0):reserveCumulativeBorrowRateWads.div(userCumulativeBorrowRateWads)
    const totalAvailableInUsd = totalAvailableAmount.times(liquidityPrice)
    let totalBorrowedAmount = eX(info.liquidity.borrowedAmountWads.toString(),-18)
    // 这里可能剩余一点渣，也就是小于1的一个数，此时直接当成0来处理
    if (totalBorrowedAmount.lt(BIG_NUMBER_ONE)) {
        totalBorrowedAmount = BIG_NUMBER_ZERO
    } else {
        totalBorrowedAmount = totalBorrowedAmount.div(10**decimals)
    }
    const totalBorrowedInUsd = totalBorrowedAmount.times(liquidityPrice)
    const totalLiquidityAmount = new BigNumber(eX(info.liquidity.availableAmount.toString(),-decimals)).plus(totalBorrowedAmount).minus(eX(info.liquidity.ownerUnclaimed.toString(),-18-decimals))
    const totalLiquidityInUsd = totalLiquidityAmount.times(liquidityPrice)
    const mintTotalSupply = eX(info.collateral.mintTotalSupply.toString(),-1*Number(decimals))
    let exchangeRate:typeof BigNumber
    if (mintTotalSupply.isZero() || totalLiquidityAmount.isZero()){
        exchangeRate = BIG_NUMBER_ONE
    } else {
        exchangeRate = mintTotalSupply.div(totalLiquidityAmount)
    }
    const supplyBalanceInTokenUnit = (mintTotalSupply.isZero()||totalLiquidityAmount.isZero())?collateralTokenBalanceInTokenUnit.times(BIG_NUMBER_ONE):collateralTokenBalanceInTokenUnit.div(mintTotalSupply).times(totalLiquidityAmount)
    const supplyBalance = supplyBalanceInTokenUnit.times(liquidityPrice)

    const collateralFactor = new BigNumber(info.config.loanToValueRatio.toString()).div(100)

    let borrowBalanceInTokenUnit = eX(userObligation?.info.borrows.filter(liquidity=>liquidity.borrowReserve.equals(reserveDetail.pubkey))[0]?.borrowedAmountWads.toString()||'0',-1*Number(decimals)-18)

    borrowBalanceInTokenUnit = borrowBalanceInTokenUnit.times(compoundedInterestRate)
    const borrowBalance = borrowBalanceInTokenUnit.times(liquidityPrice)
    const {lTokenMiningRatio,borrowMiningRatio}=getMineRatio( info)
    const larixSupplyDistributionRate=lTokenMiningRatio

    const larixBorrowDistributionRate =borrowMiningRatio
    const larixTotalMiningSpeed = eX(new BigNumber(info.bonus.totalMiningSpeed),-6)
    // @ts-ignore
    const supplyLimit = info.liquidity.supplyLimit
    const rateModelArray = getInterest(reserveDetail)
    const depositLimit = eX(info.depositLimit.toString(),-decimals)
    // @ts-ignore
    const sortWeight = SORT_WEIGHT[symbol]
    let logoSource
    try {
        logoSource = require(`../assets/coin/asset_${symbol}.${isLP?'png':'svg'}`);
    } catch (e) {
        logoSource = require(`../assets/coin/token.svg`);
    }

    // @ts-ignore
    // @ts-ignore
    return {
        reserveDetail,
        symbol,
        fullName,
        tokenName,
        logoSource,
        isLP,
        lpInfo,
        miningSupplyAmount,
        // underlyingAddress
        liquidityMintPubkey,
        userLiquidityTokenAccount,
        // cTokenAddress
        collateralMintPubkey,
        userCollateralTokenAccount,
        decimals,
        // underlyingPrice
        liquidityPrice,
        // 钱包余额
        walletBalanceInTokenUnit,
        walletBalance,
        collateralTokenBalanceInTokenUnit,
        // 剩余流动性
        totalAvailableAmount,
        totalAvailableInUsd,
        // 总借款
        totalBorrowedAmount,
        totalBorrowedInUsd,
        // 总存款
        totalLiquidityAmount,
        totalLiquidityInUsd,
        // cToken Minted
        mintTotalSupply,
        // 兑换率
        exchangeRate,
        // 用户存款
        supplyBalanceInTokenUnit,
        supplyBalance,
        // 用户借款
        borrowBalanceInTokenUnit,
        borrowBalance,
        // 抵押因子
        collateralFactor,
        // 是否开启抵押
        isEnterMarket,
        supplyDistributionApy:new  BigNumber(0),
        borrowDistributionApy:new BigNumber(0),
        hasBorrowTokenAccount: borrowTokenAccount!==undefined,
        larixTotalMiningSpeed,
        larixSupplyDistributionRate,
        larixBorrowDistributionRate,
        borrowInterestFee,
        //用户的CumulativeBorrowRateWads
        userCumulativeBorrowRateWads,
        //池子的CumulativeBorrowRateWads
        reserveCumulativeBorrowRateWads,
        compoundedInterestRate,
        supplyLimit,
        //算出来的利率模型数组
        rateModelArray,
        sortWeight,
        depositLimit,
        liquidationThreshold

    }
}
function getUserLarixPosition(position:Detail<Position>,larixLockPoolRewardBPerShare:any){
    const lpAmount  = eX(new BigNumber(position.info.lpAmount),-6)
    const endTime = position.info.endTime.toNumber()
    const startTime = position.info.startTime.toNumber()
    const endTimeString = new Date(parseInt(String(endTime)) * 1000).toLocaleString().replace(/:\d{1,2}$/, ' ').split(' ')[0]
    const startTimeString = new Date(parseInt(String(startTime)) * 1000).toLocaleString().replace(/:\d{1,2}$/, ' ').split(' ')[0]
    const larixRewardAmount = eX(larixLockPoolRewardBPerShare.minus(eX(position.info.startRewardBPerShare.toString(),-18)).times(new BigNumber(position.info.lpAmount)),-6)
    // console.log('endTimeString',new Date(parseInt(String(endTime)) * 1000).toLocaleString())
    // console.log('startTimeString',new Date(parseInt(String(startTime)) * 1000).toLocaleString())
    return{
        lpAmount,
        startTime,
        endTime,
        startTimeString,
        endTimeString,
        position,
        larixRewardAmount
    }
}
// 更新数据主入口
async function updateData(userObligationIndex:number) {
    // 检查用户是否连接钱包
    // @ts-ignore
    let wallet = getWallet()
    if (!wallet) {
        // 当钱包未及时注入时，1秒内持续检测
        for (let i = 0; i < 100; i++) {
            await new Promise<void>(resolve => setTimeout(() => resolve(), 10))
            wallet = getWallet()
            if (wallet) {
                break
            }
        }
        if (!wallet) {
            return
        }
    }

    let lendingMarket,lendingReserveArray,mineCollateralLp
    const allPrice = {
        symbol:BigNumber
    } as any
    const allDecimals = {
        decimals: Number
    } as any
    let netRate
    let larixPrice =0
    let allMarketTotalSupply = new BigNumber(0);
    let allMarketsTotalBorrow = new BigNumber(0);
    let userLarixReward = new BigNumber(0);
    let yearSupplyInterest = new BigNumber(0);
    let yearBorrowInterest = new BigNumber(0);
    let yearMiningInterest = new BigNumber(0);
    let totalDailyMining = new BigNumber(0);
    let larixCirculation = new BigNumber(0);
    let userTotalSupply = new BigNumber(0);
    let userTotalBorrow = new BigNumber(0);
    let userBorrowLimit = new BigNumber(0);
    let userLiquidationThreshold = new BigNumber(0)
    const autoFreshTime = new Date().valueOf()
    const lpApyProvider = new LpApyProvider()
    try {
        const allRequests = await Promise.all(
            [
                getLendingMarketLocal(),
                getLendingReserve(),
                // @ts-ignore
                getTokenAccounts(wallet.publicKey),
                // @ts-ignore
                getObligation(wallet.publicKey),
                // @ts-ignore
                getMining(wallet.publicKey),
                getDetailService.getLarixPrice(),
                getDetailService.getDoubleRewardPrice(),
            ]
        )
        lendingMarket = allRequests[0]
        lendingReserveArray = allRequests[1].reserveArrayInner
        mineCollateralLp = allRequests[1].mineCollateralLp
        // @ts-ignore
        const userAllTokenAccounts = allRequests[2]
        const larixTokenAccount = userAllTokenAccounts.get(lendingMarket.info.mineMint.toString());
        // @ts-ignore
        const userAllObligationArray = allRequests[3]
        // @ts-ignore
        const mining = allRequests[4]
        larixPrice = allRequests[5].toNumber()
        const mndePrice = Number(allRequests[6]['marinade'].usd)
        const lidoDaoPrice = Number(allRequests[6]['lido-dao'].usd)
        allPrice['MNDE'] = mndePrice
        allDecimals['MNDE'] = 9
        allPrice['LDO'] = lidoDaoPrice
        const userAllObligation = userAllObligationArray?.[userObligationIndex]
        store.commit('updateLendingMarket', lendingMarket)
        store.commit('updateMining', mining?.[0])
        store.commit('updateAllMining', mining)
        store.commit('updateLarixPrice', larixPrice)
        store.commit('updateUserObligation', userAllObligation)
        store.commit('updateUserAllObligation', userAllObligationArray)
        store.commit('updateLendingReserveArray',lendingReserveArray)
        store.commit('updateLarixTokenAccount',larixTokenAccount)
        store.commit('updateAutoFreshTime',autoFreshTime)
        let allReserveData = await Promise.all(lendingReserveArray.map((item)=>{
            return getReserveData(item, wallet,
                userAllTokenAccounts,
                userAllObligationArray||[],
                mining,userObligationIndex)
        }))
        // let userTotalLTokenAmount = new BigNumber(0);
        // let userObligationDepositedLTokenAmount = new BigNumber(0);
        // let userObligationBorrowLTokenAmount = new BigNumber(0);
        // let userMiningLTokenAmount = new BigNumber(0);
        const doubleRewardProvider = new DoubleReward()
        allReserveData = allReserveData.map((res: any) => {
            const utilizationRateRaw = res.totalLiquidityAmount.isZero()?new BigNumber(0):res.totalBorrowedAmount.div(res.totalLiquidityAmount)
            const utilizationRate = utilizationRateRaw.isGreaterThan(1) ? new BigNumber(1) : utilizationRateRaw
            res.borrowApy = res.reserveDetail.info.config.borrowYearCompoundedInterestRate
            res.supplyApy = res.reserveDetail.info.config.supplyYearCompoundedInterestRate
            doubleRewardProvider.setDoubleRewardConfig(res,allPrice)
            res = doubleRewardProvider.getDoubleRewardDetails()
            yearSupplyInterest = yearSupplyInterest.plus(
                res?.supplyBalance.times( res.supplyApy)
            );
            yearBorrowInterest = yearBorrowInterest.plus(
                res?.borrowBalance.times( res.borrowApy)
            );

            yearSupplyInterest = yearSupplyInterest.plus(
                res?.supplyBalance.times( res?.singleTokenDoubleRewardApy||0)
            );
            yearBorrowInterest = yearBorrowInterest.minus(
                res?.borrowBalance.times( (res?.singleTokenDoubleBorrowRewardApy||new BigNumber(0)).div(100))
            )
            const price = res.liquidityPrice
            const symbol = res.symbol
            //@ts-ignore
            allPrice[symbol] = price
            allDecimals[symbol] = res.decimals
            //@ts-ignore
            isNaN(larixPrice)?res.supplyDistributionApy=0:res.supplyDistributionApy = res.larixSupplyDistributionRate.times(10).times(res.larixTotalMiningSpeed).times(REAL_SLOTS_PER_DAY).times(365).times(larixPrice).div(res.totalLiquidityInUsd.isZero()?1:res.totalLiquidityInUsd)
            // 借款挖矿APR
            //挖矿每日产出
            res.dailyMining = (res.larixTotalMiningSpeed.times(REAL_SLOTS_PER_DAY))
            //@ts-ignore
            isNaN(larixPrice)?res.borrowDistributionApy=0:res.borrowDistributionApy = res.larixBorrowDistributionRate.times(10).times(res.larixTotalMiningSpeed).times(REAL_SLOTS_PER_DAY).times(365).times(larixPrice).div(res.totalBorrowedInUsd.isZero()?1:res.totalBorrowedInUsd)
            res.mlpApy = new BigNumber(0)
            const currentTime = new Date().valueOf()
            //@ts-ignore
            const circulationTime = new BigNumber((currentTime-1631858400000)/3600000)
            //9.17 12:00 :1631851200000
            //9.17 14:00 :1631858400000
            totalDailyMining = totalDailyMining.plus(new BigNumber(res.dailyMining))
        if (!circulationTime.isGreaterThan(0)) larixCirculation = 0
        else {
           larixCirculation =  new BigNumber(new BigNumber(TOTAL_LARIX_DAILY).div(24).times(circulationTime).plus(IEO_LARIX_AMOUNT).toFixed(2))
        }
            userTotalSupply = userTotalSupply.plus(res.supplyBalance);
            userTotalBorrow = userTotalBorrow.plus(res.borrowBalance);
            userBorrowLimit = userBorrowLimit.plus(
                res.isEnterMarket
                    ? res.supplyBalance.times(res.collateralFactor)
                    : 0
            );
            userLiquidationThreshold = userLiquidationThreshold.plus(
                res.isEnterMarket
                    ? res.supplyBalance.times(res.liquidationThreshold)
                    : 0
            )
            allMarketTotalSupply = allMarketTotalSupply.plus(res.totalLiquidityInUsd)
            allMarketsTotalBorrow = allMarketsTotalBorrow.plus(res.totalBorrowedInUsd)
            res.utilizationRate = utilizationRate
            return res
        })
        const lpFeesApyDetails = store.state.market.lpFeesAprDetails
        allReserveData.forEach((reserve)=>{
            if (reserve.isLP){
                doubleRewardProvider.setDoubleRewardConfig(reserve,allPrice)
                doubleRewardProvider.getLpDoubleRewardDetails()
                // @ts-ignore
                const rewardAPrice = allPrice[LP_REWARD_TOKEN[reserve.symbol].rewardA]||new BigNumber(0)
                // @ts-ignore
                const rewardBPrice = allPrice[LP_REWARD_TOKEN[reserve.symbol].rewardB]||new BigNumber(0)
                // @ts-ignore
                const rewardADecimals = allDecimals[LP_REWARD_TOKEN[reserve.symbol].rewardA]||0
                // @ts-ignore
                const rewardBDecimals = allDecimals[LP_REWARD_TOKEN[reserve.symbol].rewardB]||0
                const TVL = reserve.lpInfo.farmPoolLpSupply.times(reserve.liquidityPrice)
                lpApyProvider.setPool(reserve.lpInfo.perBlock,reserve.lpInfo.perBlockB)
                const lpApyDetails = lpApyProvider.getLpApyDetails(TVL,rewardAPrice,rewardBPrice,rewardADecimals,rewardBDecimals)
                const apyA = lpApyDetails.apyA
                const apyB = lpApyDetails.apyB
                const totalApy = lpApyDetails.totalApy
                reserve.lpInfo.lpApr = new BigNumber(totalApy).times(100)
                reserve.lpInfo.lpRewardAprA =  new BigNumber(apyA).times(100)
                reserve.lpInfo.lpRewardAprB =  new BigNumber(apyB).times(100)
                yearSupplyInterest = yearSupplyInterest.plus(reserve.supplyBalance.times(reserve.lpInfo.lpApr.div(100).plus(reserve.lpInfo.doubleRewardApy)))
                if (lpFeesApyDetails.length>0){
                    const feesApy = lpFeesApyDetails.find((item:any) => item.symbol === reserve.symbol)
                    reserve.lpInfo.lpFeesApr = feesApy?.lpFeesApr
                }
            }else {
                return
            }
        })
        const result = await calculateAllMine(
            //@ts-ignore
            mining == undefined ? undefined : mining[0],
            userAllObligation,
            lendingReserveArray
        )
        userLarixReward =  result
        store.commit('updateUserTotalSupply',userTotalSupply)
        store.commit('updateUserTotalBorrow',userTotalBorrow)
        store.commit('updateUserLarixReward',userLarixReward)
        store.commit('updateUserBorrowLimit',userBorrowLimit)
        store.commit('updateUserLiquidationThreshold',userLiquidationThreshold)
        store.commit('updateTotalDailyMining',totalDailyMining)
        store.commit('updateAllMarketTotalSupply', allMarketTotalSupply)
        store.commit('updateAllMarketTotalBorrow', allMarketsTotalBorrow)
        store.commit('updateUserLarixReward', userLarixReward)
        store.commit('updateAllReservesDetails',allReserveData)
        store.commit('updateIsLoadingInfo',false)
        store.commit('updateLarixCirculation',larixCirculation)

    } catch (e) {
        appController.controlDataError(10)
        console.log(e)
    }finally {
        const allReserveData = store.state.market.allReservesDetails
        const userAllObligation = store.state.market.userAllObligation
        const secondaryData = await Promise.all([
            getDetailService.getRaydiumPools(),
            //@ts-ignore
            withdrawLpAccountProviderByOwner(wallet.publicKey),
            //@ts-ignore
            getPositionsByOwner(wallet.publicKey),
            //@ts-ignore
            getUserFeeLarixInfoByOwner(wallet.publicKey),
            getLarixLockPool(true)
        ])
        const raydiumPools = secondaryData[0]
        const needHandle = secondaryData[1]
        const userLarixPositions = secondaryData[2]
        let needToHanldeUserFeeLarixInfo = secondaryData[3] as any
        const lockLarixPool = secondaryData[4]
        const larixLockPoolTotalLp = new BigNumber(mineCollateralLp.farmLedger.info.deposited.toString())
        const larixLockPoolRewardDebtB = new BigNumber(mineCollateralLp.farmLedger.info.rewardDebtB.toString())
        const farmPoolPerShareB = eX(mineCollateralLp.rewardInfo.info.perShareB.toString(),-15)
        const increaseReward = farmPoolPerShareB.times(larixLockPoolTotalLp).minus(larixLockPoolRewardDebtB)
        const larixLockPoolRewardBPerShare =  eX(lockLarixPool.rewardBPerShare.toString(),-18).plus(increaseReward.div(larixLockPoolTotalLp))

        const lpFeeApyProvider = new LpFeeApyProvider(raydiumPools,mineCollateralLp)
        const needToWithdrawLpArray = [] as  Detail<WithdrawLpAccount>[]
        const needToHandleCtokenAccounts = [] as any

        needHandle.forEach((pool:any)=>{
            if (new BigNumber(pool.info.amount).isGreaterThan(0)){
                needToWithdrawLpArray.push(pool)
            }
            allReserveData.forEach((reserve:any)=>{
                if (reserve.isLP===0){
                    return
                }
                else {
                    needToWithdrawLpArray.forEach((item)=>{
                            if (item.info.poolId.equals(reserve.reserveDetail.info.liquidity.params_1)){
                                item.info.symbol = reserve.fullName
                                item.info.logoSource = reserve.logoSource
                                item.info.amount = eX(item.info.amount.toString(),-reserve.decimals)
                                item.info.userLiquidityTokenAccount = reserve.userLiquidityTokenAccount
                                item.info.reserveDetails = reserve.reserveDetail
                            }
                        })
                }
            })
        })
        allReserveData.forEach((reserve:any)=>{
            if (new BigNumber(reserve.userCollateralTokenAccount?.info.amount).isGreaterThan(0)){
                let target
                userAllObligation.forEach((userObligation:any)=>{
                    userObligation.info?.deposits.forEach((deposit:ObligationCollateral)=>{
                        if (reserve.reserveDetail.pubkey.equals(deposit.depositReserve)){
                            target = userObligation
                        }
                    })
                })
                needToHandleCtokenAccounts.push({
                    isInMining:reserve.miningSupplyAmount.isGreaterThan(0),
                    isEnterMarket:!!target,
                    account:reserve.userCollateralTokenAccount,
                    logoSource:reserve.logoSource,
                    amount:eX(reserve.userCollateralTokenAccount?.info.amount.toString()||'0',-1*Number(reserve.decimals)),
                    symbol:reserve.fullName,
                    userLiqiudityAccount:reserve.userLiqiudityAccount,
                    reserveDetail:reserve.reserveDetail,
                    mintPubkey:reserve.reserveDetail.pubkey.toString(),
                    targetObligation:target?target:null
                })
            }
        })
        const lpFeesAprDetails = [] as any
        allReserveData.forEach((reserve:any)=>{
            if (reserve.isLP&&raydiumPools){
                const apy = lpFeeApyProvider.getPoolFeeApy(reserve.lpInfo.amm_id.toString())
                reserve.lpInfo.lpFeesApr = apy
                yearSupplyInterest = yearSupplyInterest.plus(reserve.supplyBalance.times(reserve.lpInfo.lpFeesApr/100))
                lpFeesAprDetails.push({
                        symbol:reserve.symbol,
                        lpFeesApr:apy
                    }
                )
            }else {
                return
            }
        })
        const netValue = userTotalSupply.minus(userTotalBorrow)
        const netApy = !userTotalSupply.isZero()
            ? yearSupplyInterest
                .minus(yearBorrowInterest)
                .div(netValue)
                .toFixed(4)
            : 0
        // 计算存借款挖矿年收益
        allReserveData.forEach((item:any)=>{
            yearMiningInterest = yearMiningInterest.plus(
                item.supplyBalanceInTokenUnit.times(item.liquidityPrice).times(item.supplyDistributionApy)
            ).plus(
                item.borrowBalanceInTokenUnit.times(item.liquidityPrice).times(item.borrowDistributionApy)
            )
        })
        // 计算存借款挖矿APY
        const miningApy = !userTotalSupply.isZero()
            ? yearMiningInterest
                .div(netValue)
                .toFixed(4)
            : 0
        netRate = new BigNumber(netApy).plus(miningApy)
        lpFeeApyProvider.setPool(new BigNumber(mineCollateralLp.rewardInfo.info.perBlock),new BigNumber(mineCollateralLp.rewardInfo.info.perBlockB))
        const larixStakeTvl = lpFeeApyProvider.getTvl(LARIX_USDC_POOL.amm_Id.toString())?.totalFarmLp
        const larixStakeLpPrice = lpFeeApyProvider.getTvl(LARIX_USDC_POOL.amm_Id.toString())?.lpPrice
        const larixStakePoolFeeApy = lpFeeApyProvider.getPoolFeeApy(LARIX_USDC_POOL.amm_Id.toString())
        const larixStakePoolTotalApy = lpFeeApyProvider.getLpApyDetails(new BigNumber(larixStakeTvl),new BigNumber(0),new BigNumber(larixPrice),0,6).totalApr
        mineCollateralLp.feeApy = larixStakePoolFeeApy
        mineCollateralLp.apy = larixStakePoolTotalApy
        mineCollateralLp.lpPrice = larixStakeLpPrice
        mineCollateralLp.currentTime = new Date().valueOf() / 1000
        // @ts-ignore
        const userLarixPositionsDetails = userLarixPositions.map((position)=>{
            return getUserLarixPosition(position,larixLockPoolRewardBPerShare)
        })
        needToHanldeUserFeeLarixInfo = needToHanldeUserFeeLarixInfo.map((info:any)=>{
            const larixImg = require('../assets/reward_LARIX@2x.png')
            // const usdcImg = require('../assets/coin/asset_USDC.svg')
            const larixAmount = eX(new BigNumber(info.info.larixAmount),-6)
            const symbol = 'LARIX'
            return{
                info,
                symbol,
                larixImg,
                larixAmount
            }
        })
        // console.log('userFeeLarixInfo',needToHanldeUserFeeLarixInfo)
        store.commit('updateNetRate',netRate)
        store.commit('updateMineCollateralLpDetails',mineCollateralLp)
        store.commit('updateNeedToHandleCtokenAccounts',needToHandleCtokenAccounts)
        store.commit('updateNeedToHanldeUserFeeLarixInfo',needToHanldeUserFeeLarixInfo)
        store.commit('updateNeedToWithdrawLpArray',needToWithdrawLpArray)
        store.commit('updateLpFeesAprDetails',lpFeesAprDetails)
        store.commit('updateUserLarixPositions',userLarixPositionsDetails)
        store.commit('updateUserRawPositionData',userLarixPositions)
        store.commit('updateIsLoadingUserLarixStakeInfo',false)
        store.commit('updateAllReservesDetails',allReserveData)
    }
}

export default {
    updateData,
}
