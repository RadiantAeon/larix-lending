import {Account, Connection, PublicKey, Signer, TransactionInstruction} from "@solana/web3.js";
import {LARIX_LOCK_AMM_INFO} from "@/api/constants/config";
import {removeLiquidityInstructionV4} from "@/api/models/instructions/larix-lock-pool/removeLiquidity";
import BN from "bn.js";

export function removeLiquidity(
    connection:Connection,
    signers: Signer[],
    instructions: TransactionInstruction[],
    cleanupInstructions: TransactionInstruction[],
    userLpTokenAccount: PublicKey,
    userCoinTokenAccount: PublicKey,
    userPcTokenAccount: PublicKey,
    userOwner: PublicKey,
    amount: BN
){
    const ammInfo = LARIX_LOCK_AMM_INFO
    instructions.push(removeLiquidityInstructionV4(
        ammInfo.programId,
        ammInfo.ammId,
        ammInfo.ammAuthority,
        ammInfo.ammOpenOrders,
        ammInfo.ammTargetOrders,
        ammInfo.lpMint,
        ammInfo.poolCoinTokenAccount,
        ammInfo.poolPcTokenAccount,
        ammInfo.poolWithdrawQueue,
        ammInfo.poolTempLpTokenAccount,
        ammInfo.serumProgramId,
        ammInfo.serumMarket,
        ammInfo.serumCoinVaultAccount,
        ammInfo.serumPcVaultAccount,
        ammInfo.serumVaultSigner,
        ammInfo.serumEventQueue,
        ammInfo.serumBids,
        ammInfo.serumAsks,
        userLpTokenAccount,
        userCoinTokenAccount,
        userPcTokenAccount,
        userOwner,
        amount
    ))
}