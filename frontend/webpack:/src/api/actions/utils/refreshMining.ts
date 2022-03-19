import {Account, Connection, TransactionInstruction} from "@solana/web3.js";
import {refreshMiningInstruction} from "@/api/models/instructions/refreshMining";
import {Detail, Reserve} from "@/api/models";
import {Mining} from "@/api/models/state/mining";

export async function refreshMining(
    connection:Connection,
    signers: Account[],
    instructions: TransactionInstruction[],
    cleanupInstructions: TransactionInstruction[],
    mining:Detail<Mining>
){
    if (mining.info.miningIndices.length===0){
        return
    }
    const reserves = mining.info.miningIndices.map(miningIndex => {
       return miningIndex.reserve
    })
    instructions.push(refreshMiningInstruction(
        mining.pubkey,
        reserves
    ))
}