import {Account, Connection, PublicKey, Signer, TransactionInstruction} from "@solana/web3.js";
import {createStakeInstruction} from "@/api/models/instructions/larix-lock-pool/stake";
import {Program} from "@project-serum/anchor";
import {LarixLockPool} from "@/api/models/state/larixLockPool";

export function stake(
    connection:Connection,
    signers: Signer[],
    instructions: TransactionInstruction[],
    cleanupInstructions: TransactionInstruction[],
    program: Program,
    larixLockPoolId: PublicKey,
    larixLockPool: LarixLockPool
){
    instructions.push(createStakeInstruction(
        program,
        larixLockPoolId,
        larixLockPool
    ))
}