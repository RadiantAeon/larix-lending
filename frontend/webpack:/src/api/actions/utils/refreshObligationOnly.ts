import {Account, Connection, Signer, TransactionInstruction} from "@solana/web3.js";
import {
    Detail,
    Obligation,
    refreshObligationInstruction,
} from "../../models";

export async function refreshObligationOnly(
    connection:Connection,
    signers: Signer[],
    instructions: TransactionInstruction[],
    cleanupInstructions: TransactionInstruction[],
    obligation: Detail<Obligation>,
){
    if (!obligation){
        return
    }
    instructions.push(refreshObligationInstruction(
        obligation.pubkey,
        obligation.info.deposits.map(collateral => collateral.depositReserve),
        obligation.info.borrows.map(liquidity => liquidity.borrowReserve),
    ))
}