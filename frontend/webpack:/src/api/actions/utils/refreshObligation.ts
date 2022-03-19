import {Account, Connection, Signer, TransactionInstruction} from "@solana/web3.js";
import {
    Detail,
    Obligation,
    refreshObligationInstruction,
    Reserve
} from "../../models";
import {refreshReserves} from "./refreshReserves";
import {getAllReserveOfObligation} from "@/api/actions/utils/getAllReserveOfObligation";

export async function refreshObligation(
    connection:Connection,
    signers: Signer[],
    instructions: TransactionInstruction[],
    cleanupInstructions: TransactionInstruction[],
    obligation: Detail<Obligation>,
    allReserve:Array<Detail<Reserve>>,
    borrowReserve?:Detail<Reserve>
){
    const reserveSet = new Set<Detail<Reserve>>()
    getAllReserveOfObligation(obligation,allReserve,reserveSet)
    if (borrowReserve){
        reserveSet.add(borrowReserve)
    }
    const refreshReserveArray = new Array<Detail<Reserve>>();
    reserveSet.forEach((reserve)=>{
        refreshReserveArray.push(reserve)
    });

    await refreshReserves(
        instructions,
        refreshReserveArray
        )

    instructions.push(refreshObligationInstruction(
        obligation.pubkey,
        obligation.info.deposits.map(collateral => collateral.depositReserve),
        obligation.info.borrows.map(liquidity => liquidity.borrowReserve),
    ))
}