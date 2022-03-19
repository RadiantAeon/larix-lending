import {getConnection} from "@/api/context/connection";
import {IS_PRODUCTION, LENDING_ID, LENDING_PROGRAM_ID, LP_RESERVE_IDS, RESERVE_IDS} from "@/api/constants/config";
import { cloneDeep } from 'lodash';
import {
    Detail,
    Obligation,
    ObligationLayout,
    ObligationParser,
    Reserve
} from "../models"
import BufferLayout from "buffer-layout";
import {LastUpdateLayout} from "@/api/models/state/lastUpdate";
import {PublicKey} from "@solana/web3.js";
import BigNumber from "bignumber.js";
import {eX} from "@/utils/helpers";
let reserveSet:Set<PublicKey>
// @ts-ignore
export async function getObligation(ownerAddress:PublicKey,actionType:string|null):Promise<Array<Detail<Obligation>>>{
    if (!reserveSet){
        reserveSet = new Set<PublicKey>();
        RESERVE_IDS.map(reservePublicKey => {
            reserveSet.add(reservePublicKey)
        })
        LP_RESERVE_IDS.map(reserveConfig=>{
            reserveSet.add(reserveConfig.reserveID)
        })
    }
    const connection = await getConnection()
    const accountInfos = await connection.getProgramAccounts(LENDING_PROGRAM_ID,{
        filters:[
            {
                dataSize: ObligationLayout.span
            },
            {
                memcmp: {
                    offset: BufferLayout.u8('version').span+LastUpdateLayout.span+32,
                    /** data to match, as base-58 encoded string and limited to less than 129 bytes */
                    bytes: ownerAddress.toBase58()
                }
             }

        ]
    })
    const resultArray = new Array<Detail<Obligation>>();
    accountInfos.map(function (item):any{
    //    formal
        const obligationParser = ObligationParser(item.pubkey,item.account)
        resultArray.push(obligationParser)

    })
    const sortResultArray = resultArray.sort( ( a, b)=>{
        return b.pubkey.toString().localeCompare(a.pubkey.toString())
    })
    return sortResultArray
}
export async function getObligations(lendingMarketAddress: PublicKey,reserveArray:Array<Detail<Reserve>>): Promise<Array<Detail<Obligation>>> {
    const connection = await getConnection();
    const allAccountInfos = await connection.getProgramAccounts(LENDING_PROGRAM_ID
        ,
        {
            filters:[
                {
                    dataSize: ObligationLayout.span
                }
            ]
        }
    );
    const lpObligations = new Array<Detail<Obligation>>();
    const resultArray = new Array<Detail<Obligation>>();
    const top10BorrowUser = new Array<Detail<Obligation>>();
    allAccountInfos.map(function(item): any {

        const obligation = ObligationParser(item.pubkey, item.account);
        if (obligation.info.lendingMarket.equals(lendingMarketAddress)) {
            if (obligation.info.borrows.length ==0){
                return
            }
            let hasLP = false
            let logoSource
            obligation.info.depositedValueInBibNumber = new BigNumber(0)
            obligation.info.borrowLimitValueInBibNumber = new BigNumber(0)
            obligation.info.deposits.map((deposit)=>{
                reserveArray.map((reserve)=>{
                    if (deposit.depositReserve.equals(reserve.pubkey)){
                        if (reserve.info.isLP){
                            hasLP = true
                            deposit.isLP = true
                        }
                        deposit.depositedInTokenUnit = eX(deposit.depositedAmount.toString(),-reserve.info.liquidity.mintDecimals).div(reserve.info.liquidity.exchangeRate)
                        deposit.depositedMarketValue = deposit.depositedInTokenUnit.times(reserve.info.liquidity.liquidityPrice)

                        deposit.reserve = reserve
                        try {
                            logoSource = require(`../../assets/coin/asset_${reserve.info.liquidity.name}.${reserve.info.isLP?'png':'svg'}`);
                        } catch (e) {
                            logoSource = require(`../../assets/coin/token.svg`);
                        }
                        // @ts-ignore
                        deposit.reserve.logoSource = logoSource
                        obligation.info.depositedValueInBibNumber =  obligation.info.depositedValueInBibNumber.plus(deposit.depositedMarketValue)
                        obligation.info.borrowLimitValueInBibNumber = obligation.info.borrowLimitValueInBibNumber.plus(deposit.depositedMarketValue.times(new BigNumber(reserve.info.config.liquidationThreshold.toString())).div(100))
                    }
                })

            })
            obligation.info.borrowedValueInBigNumber = new BigNumber(0)
            obligation.info.borrows.map((borrow)=>{
                reserveArray.map((reserve)=>{
                    if (borrow.borrowReserve.equals(reserve.pubkey)){

                        const compoundedInterestRate = new BigNumber(reserve.info.liquidity.cumulativeBorrowRateWads.toString())
                            .div(new BigNumber(borrow.cumulativeBorrowRateWads.toString()))
                        borrow.borrowAmountValueInTokenUnit = compoundedInterestRate.times(eX(borrow.borrowedAmountWads.toString(),-18-reserve.info.liquidity.mintDecimals))
                        borrow.marketValueInBigNumber = borrow.borrowAmountValueInTokenUnit.times(reserve.info.liquidity.liquidityPrice)
                        borrow.reserve = reserve
                        obligation.info.borrowedValueInBigNumber =  obligation.info.borrowedValueInBigNumber.plus(borrow.marketValueInBigNumber)
                        try {
                            logoSource = require(`../../assets/coin/asset_${reserve.info.liquidity.name}.${reserve.info.isLP?'png':'svg'}`);
                        } catch (e) {
                            logoSource = require(`../../assets/coin/token.svg`);
                        }
                        // @ts-ignore
                        borrow.reserve.logoSource = logoSource
                    }
                })
            })
            if (obligation.info.borrowedValueInBigNumber.isGreaterThan(500)){
                top10BorrowUser.push(obligation)
            }
            const rate = obligation.info.borrowedValueInBigNumber.div(obligation.info.borrowLimitValueInBibNumber.isZero()?1:obligation.info.borrowLimitValueInBibNumber)
            obligation.info.debtRatio = rate
            if (hasLP){
                lpObligations.push(obligation)
            }
            if (obligation.info.deposits.length>0&&rate.isGreaterThan(0.9))
            {
                let allDepositValue = new BigNumber(0)
                if (rate.isGreaterThan(0.99))
                {
                    obligation.info.deposits.map((deposit)=>{
                        allDepositValue = deposit.depositedMarketValue.plus(allDepositValue)
                    })
                    if (allDepositValue.isLessThan(0.1)){
                        return
                    }
                }
                const sortBorrows = obligation.info.borrows.slice()
                const sortDeposits = obligation.info.deposits.slice()
                sortBorrows.sort((b:any,a:any)=>{
                    return a.marketValueInBigNumber.minus(b.marketValueInBigNumber).toNumber()
                })
                sortDeposits.sort((b:any,a:any)=>{
                    return a.depositedMarketValue.minus(b.depositedMarketValue).toNumber()
                })

                obligation.info.sortBorrows = sortBorrows
                obligation.info.sortDeposits = sortDeposits

                resultArray.push(obligation);
            }
        }
    });
    lpObligations.sort((a,b)=>{
        return b.info.debtRatio.toNumber()-a.info.debtRatio.toNumber()
    })
    // console.log("")
    // console.log("所有存了抵押了lp的obligation")
    // console.log("lpObligations.length",lpObligations.length)
    // lpObligations.map(obligation=>{
    //     console.log("")
    //     console.log("owner",obligation.info.owner.toString())
    //     console.log("debtRatio",obligation.info.debtRatio.toFixed(4))
    //     console.log("deposit:")
    //     console.log("depositedValue",obligation.info.depositedValueInBibNumber.toFixed(4))
    //     obligation.info.deposits.map((deposit)=> {
    //         reserveArray.map((reserve) => {
    //             if (deposit.depositReserve.equals(reserve.pubkey)) {
    //                 console.log("   ",reserve.info.liquidity.name);
    //                 console.log("   ",deposit.depositedInTokenUnit.toFixed(4));
    //                 console.log("   ",deposit.depositedMarketValue.toFixed(4));
    //             }
    //         })
    //     })
    //     console.log("borrow:")
    //     console.log("borrowLimitValue", obligation.info.borrowLimitValueInBibNumber.toFixed(4))
    //     console.log("borrowedValue", obligation.info.borrowedValueInBigNumber.toFixed(4))
    //     obligation.info.borrows.map((borrow) => {
    //         reserveArray.map((reserve) => {
    //             if (borrow.borrowReserve.equals(reserve.pubkey)) {
    //                 console.log("   ",reserve.info.liquidity.name);
    //                 console.log("   ",borrow.borrowAmountValueInTokenUnit.toFixed(4));
    //                 console.log("   ",borrow.marketValueInBigNumber.toFixed(4));
    //             }
    //         })
    //     })
    // })
    top10BorrowUser.sort((a:Detail<Obligation>,b:Detail<Obligation>)=>{
        let totalBorrowB = new BigNumber(0)
            b.info.borrows.forEach((item)=>{
                totalBorrowB = totalBorrowB.plus(item.marketValueInBigNumber)
        })
        let totalBorrowA = new BigNumber(0)
        a.info.borrows.forEach((item)=>{
            totalBorrowA = totalBorrowA.plus(item.marketValueInBigNumber)
        })
        //@ts-ignore
        return totalBorrowB.minus(totalBorrowA).toNumber()
    })
    let res = ''
    top10BorrowUser.forEach((item)=>{
        let totalBorrow = new BigNumber(0)
        item.info.borrows.forEach((borrow)=>{
            totalBorrow = totalBorrow.plus(borrow.marketValueInBigNumber)
        })
        // console.log('User',item.info.owner.toString())
        // console.log('Borrow',totalBorrow.toFixed(2))
        res = res + 'User:'+item.info.owner.toString()+'\n'+'Borrow $'+totalBorrow.toFixed(2)+'\n'
    })
    // console.log(res)
    return resultArray;
}
