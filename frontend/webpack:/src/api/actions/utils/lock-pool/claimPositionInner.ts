import {Connection, PublicKey, Signer, TransactionInstruction} from "@solana/web3.js";
import {Program} from "@project-serum/anchor";
import {LarixLockPool} from "@/api/models/state/larixLockPool";
import {createClaimPositionInstruction} from "@/api/models/instructions/larix-lock-pool/claimPosition";

export function claimPositionInner(
    connection: Connection,
    signers: Signer[],
    instructions: TransactionInstruction[],
    cleanupInstructions: TransactionInstruction[],
    program: Program,
    larixLockPoolId: PublicKey,
    larixLockPool: LarixLockPool,
    position: PublicKey,
    userRewardAccount:PublicKey,
    userRewardAccountB:PublicKey
){
    instructions.push(createClaimPositionInstruction(
        program,
        larixLockPoolId,
        larixLockPool,
        position,
        userRewardAccount,
        userRewardAccountB
    ))
}