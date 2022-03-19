import {Connection, Keypair, PublicKey, Signer, TransactionInstruction} from "@solana/web3.js";
import {Program} from "@project-serum/anchor";
import {
    createClosePositionInstruction,
    createInitPositionInstruction
} from "@/api/models/instructions/larix-lock-pool/position";

export function createPosition(
    connection:Connection,
    signers: Signer[],
    instructions: TransactionInstruction[],
    cleanupInstructions: TransactionInstruction[],
    program: Program,
    larixPoolId:PublicKey,
    owner:PublicKey,
    payer:PublicKey
){
    const position = new Keypair()
    instructions.push(createInitPositionInstruction(
        program,
        larixPoolId,
        owner,
        payer,
        position
    ))
    signers.push(position)
    return position.publicKey
}
export function closePosition(
    connection:Connection,
    signers: Signer[],
    instructions: TransactionInstruction[],
    cleanupInstructions: TransactionInstruction[],
    program:Program,
    positionId:PublicKey,
    owner:PublicKey,
    destination:PublicKey
){
    instructions.push(createClosePositionInstruction(
        program,
        positionId,
        owner,
        destination
    ))
}