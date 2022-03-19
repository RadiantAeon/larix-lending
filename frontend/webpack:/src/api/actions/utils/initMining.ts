import {MiningLayout} from "../../models/state/mining";
import {createUninitializedMiningAccount} from "../../actions/utils/account";
import {createInitMiningInstruction} from "../../models/instructions/initMining";
import {Account, Connection, PublicKey, TransactionInstruction} from "@solana/web3.js";

export const initMining = async (
    connection:Connection,
    signers: Account[],
    instructions: TransactionInstruction[],
    cleanupInstructions: TransactionInstruction[],
    lendingMarket:PublicKey,
    wallet:any,
) => {
    const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
        MiningLayout.span
    )
    const miningAccount = createUninitializedMiningAccount(
        instructions,
        wallet.publicKey,
        accountRentExempt,
        signers
    )
    instructions.push(
        createInitMiningInstruction(
            miningAccount,
            wallet.publicKey,
            lendingMarket
        )
    )
    return miningAccount
}