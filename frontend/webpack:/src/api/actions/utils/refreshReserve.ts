import {Detail, Reserve} from "../../models";
import { Connection, Signer, TransactionInstruction} from "@solana/web3.js";
import {refreshReserves} from "./refreshReserves";

export const refreshReserve = async (
    connection:Connection,
    signers: Signer[],
    instructions: TransactionInstruction[],
    cleanupInstructions: TransactionInstruction[],
    reserve:Detail<Reserve>
)=>{
    await refreshReserves(
        instructions,
        [reserve]
    )
}