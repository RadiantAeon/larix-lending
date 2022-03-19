import {WalletAdapter} from "../../wallets";
import BN from "bn.js";
import {Detail, Reserve} from "../../models";
import {Connection, PublicKey, Signer, TransactionInstruction} from "@solana/web3.js";
import {LENDING_PROGRAM_ID} from "../../constants/config";
import {createWithdrawMiningInstruction} from "../../models/instructions/withdrawMining";

export const withdrawMining = async (
    connection:Connection,
    signers: Signer[],
    instructions: TransactionInstruction[],
    cleanupInstructions: TransactionInstruction[],
    mining:PublicKey,
    destinationAccount:PublicKey,
    reserve:Detail<Reserve>,
    withdrawAmount:BN,
    wallet:WalletAdapter,
    lendingMarket:PublicKey,

) => {
    if (wallet.publicKey == null){
        throw new Error("wallet need connection")
    }
    const [lendingMarketAuthority] = await PublicKey.findProgramAddress(
        [lendingMarket.toBuffer()],
        LENDING_PROGRAM_ID,
    );
    instructions.push(createWithdrawMiningInstruction(
        mining,
        withdrawAmount,
        destinationAccount,
        reserve,
        lendingMarket,
        lendingMarketAuthority,
        wallet.publicKey
    ))
}