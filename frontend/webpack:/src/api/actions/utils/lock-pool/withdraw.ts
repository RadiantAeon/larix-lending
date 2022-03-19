import {Connection, PublicKey, Signer, TransactionInstruction} from "@solana/web3.js";
import {createWithdrawInstruction} from "@/api/models/instructions/larix-lock-pool/withdraw";
import {Program} from "@project-serum/anchor";
import {LarixLockPool} from "@/api/models/state/larixLockPool";

export function withdraw(
    connection: Connection,
    signers: Signer[],
    instructions: TransactionInstruction[],
    cleanupInstructions: TransactionInstruction[],
    program: Program,
    larixLockPoolId: PublicKey,
    larixLockPool: LarixLockPool,
    position: PublicKey,
    userLpTokenAccount:PublicKey,
    userRewardAccount:PublicKey,
    userRewardAccountB:PublicKey
){
    instructions.push(createWithdrawInstruction(
        program,
        larixLockPoolId,
        larixLockPool,
        position,
        userLpTokenAccount,
        userRewardAccount,
        userRewardAccountB
    ))
}