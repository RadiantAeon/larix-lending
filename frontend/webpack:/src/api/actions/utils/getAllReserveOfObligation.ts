import {Detail, Obligation, Reserve} from "@/api/models";

export function getAllReserveOfObligation(obligation:Detail<Obligation>,allReserve:Detail<Reserve>[],reserveSet:Set<Detail<Reserve>>){
    if (obligation){
        obligation.info.deposits.map((collateral)=>{
            allReserve.map((reserve)=>{
                if (collateral.depositReserve.equals(reserve.pubkey)){
                    reserveSet.add(reserve)
                }
            })
        })
        obligation.info.borrows.map((collateral)=>{
            allReserve.map((reserve)=>{
                if (collateral.borrowReserve.equals(reserve.pubkey)){
                    reserveSet.add(reserve)
                }
            })
        })
    }


}