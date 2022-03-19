import {Detail, Obligation, ObligationCollateral} from "@/api/models";
import {Mining, MiningIndex} from "@/api/models/state/mining";
import {LP_RESERVE_ID_ARRAY} from "@/api/constants/config";

export function hasLp(userObligation:Detail<Obligation>,mining:Detail<Mining>){
    let obligationLpLength = 0
    let miningLpLength = 0
    userObligation?.info?.deposits.forEach((deposit:ObligationCollateral)=>{
        if (LP_RESERVE_ID_ARRAY.includes(deposit.depositReserve.toString()))
        {
            obligationLpLength ++
        }
    })
    mining?.info?.miningIndices.forEach((indices: MiningIndex)=>{
        if (LP_RESERVE_ID_ARRAY.includes(indices.reserve.toString())){
            miningLpLength++
        }
    })
    return {
        miningLpLength:miningLpLength,
        obligationLpLength:obligationLpLength
    }
}