import {Detail, Reserve} from "@/api/models";
import {Mining} from "@/api/models/state/mining";

export function getAllReserveOfMining(
    mining:Detail<Mining>,
    allReserve:Detail<Reserve>[],
    reserveSet:Set<Detail<Reserve>>
){
    mining.info.miningIndices.map(miningIndex => {
        allReserve.forEach(reserve => {
            if (miningIndex.reserve.equals(reserve.pubkey)){
                reserveSet.add(reserve)
            }
        })
    })
}