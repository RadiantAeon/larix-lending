import {Account, Connection, PublicKey, TransactionInstruction} from "@solana/web3.js";
import {createAddLiquidityInstruction} from "@/api/models/instructions/larix-lock-pool/addLiquidity";
import {Program} from "@project-serum/anchor";
import {LarixLockPool} from "@/api/models/state/larixLockPool";

export function addLiquidity(
    connection:Connection,
    signers: Account[],
    instructions: TransactionInstruction[],
    cleanupInstructions: TransactionInstruction[],
    program: Program,
    larixLockPoolId: PublicKey,
    larixLockPool: LarixLockPool,
    userLarixInfo: PublicKey,
    position: PublicKey,
    user: PublicKey,
    userPcAccount:PublicKey
) {
    instructions.push(createAddLiquidityInstruction(
        program,
        larixLockPoolId,
        larixLockPool,
        userLarixInfo,
        position,
        user,
        userPcAccount
    ))
}