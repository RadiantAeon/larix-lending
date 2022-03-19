import {Connection, Keypair, PublicKey, Signer, TransactionInstruction} from "@solana/web3.js";
import {Program} from "@project-serum/anchor";
import {
    createCloseUserLarixInfoInstruction,
    createInitUserLarixInfoInstruction
} from "@/api/models/instructions/larix-lock-pool/userLarixInfo";

export function createUserLarixInfo(
    connection: Connection,
    signers: Signer[],
    instructions: TransactionInstruction[],
    cleanupInstructions: TransactionInstruction[],
    program: Program,
    larixPoolId:PublicKey,
    owner:PublicKey,
    payer:PublicKey
):PublicKey{
    const userLarixInfo = new Keypair()
    instructions.push(createInitUserLarixInfoInstruction(
        program,
        larixPoolId,
        owner,
        payer,
        userLarixInfo
    ))
    signers.push(userLarixInfo)
    // cleanupInstructions.push(createCloseUserLarixInfoInstruction(
    //     program,
    //     userLarixInfo.publicKey,
    //     owner,
    //     owner
    // ))
    return userLarixInfo.publicKey
}
export function closeUserLarixInfo(
    connection: Connection,
    signers: Signer[],
    instructions: TransactionInstruction[],
    cleanupInstructions: TransactionInstruction[],
    program: Program,
    userLarixInfoId: PublicKey,
    owner:PublicKey,
    destination:PublicKey
){
    instructions.push(createCloseUserLarixInfoInstruction(
        program,
        userLarixInfoId,
        owner,
        destination
    ))
}