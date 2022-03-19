// TODO: 删除无用导入
import store from '../store'
const BigNumber = require("bignumber.js");
BigNumber.config({EXPONENTIAL_AT: 1e9});
import {getObligations} from "@/api/provider/obligationProvider";

import {Detail, Reserve, TokenAccount} from "@/api/models";
// @ts-ignore
import {BIG_NUMBER_ONE, BIG_NUMBER_ZERO, eX} from "@/utils/helpers";

import {PublicKey} from "@solana/web3.js";

// 更新清算数据入口
async function updateLiquidationData(lendingMarketAddress: PublicKey,reserveArray:Array<Detail<Reserve>>): Promise<any> {
    let obligations
    try {

        obligations = await getObligations(lendingMarketAddress, reserveArray)
        const f1 = obligations.sort((b:any,a:any)=>{
            return a.info.debtRatio - b.info.debtRatio
        })
        // obligations.map((obligation)=>{
        //
        // })
        store.commit('updateAllUserObligations',f1)

    } catch (e) {
        console.log(e)
    }
}


export default {
    updateLiquidationData,
}
