import {WalletAdapter} from "@/api/wallets";
import BN from "bn.js";
import {Detail, Reserve} from "../../models";
import {Account, Connection, PublicKey, TransactionInstruction} from "@solana/web3.js";
import {createDepositMiningInstruction} from "../../models/instructions/depositMining";
import {LENDING_PROGRAM_ID} from "../../constants/config";

export const depositMining = async (
    connection:Connection,
    signers: Account[],
    instructions: TransactionInstruction[],
    cleanupInstructions: TransactionInstruction[],
    sourceAccount:PublicKey,
    depositReserve:Detail<Reserve>,
    depositAmount:BN,
    wallet:WalletAdapter,
    lendingMarket:PublicKey,
    mining:PublicKey
) => {
    if (wallet.publicKey == null){
        throw new Error("wallet need connection")
    }
    const [lendingMarketAuthority] = await PublicKey.findProgramAddress(
        [lendingMarket.toBuffer()],
        LENDING_PROGRAM_ID,
    );
    instructions.push(createDepositMiningInstruction(
        mining,
        depositAmount,
        sourceAccount,
        depositReserve,
        lendingMarket,
        lendingMarketAuthority,
        wallet.publicKey,
        wallet.publicKey
    ))
}