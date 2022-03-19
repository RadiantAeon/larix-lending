import {Detail} from "@/api/models";
import {Position} from "@/api/models/state/position";
import {getConnection, getTransactionLength, sendTransaction} from "@/api/context/connection";
import {PublicKey, Signer, TransactionInstruction} from "@solana/web3.js";
import {stake} from "@/api/actions/utils/lock-pool/stake";
import {LARIX_LOCK_POOL_ID} from "@/api/constants/config";
import {getLarixLockPool, getLarixLockProgram} from "@/api/context/larixLock";
import {
    getOrCreateAssociatedTokenAccountByAnother
} from "@/api/actions/utils/account";
import {claimPositionInner} from "@/api/actions/utils/lock-pool/claimPositionInner";

export async function claimPosition(
    wallet:any,
    positions:Detail<Position>[],
    userRewardATokenAccount?:PublicKey,
    userRewardBTokenAccount?:PublicKey
){
    const connection =await getConnection()
    let signers: Signer[] = [];
    let instructions: TransactionInstruction[] = [];
    let cleanupInstructions: TransactionInstruction[] = [];
    const program = await getLarixLockProgram()
    const larixLockPool = await getLarixLockPool()

    if (!userRewardATokenAccount) {
        userRewardATokenAccount = await getOrCreateAssociatedTokenAccountByAnother(
            connection,
            instructions,
            wallet.publicKey,
            larixLockPool.rewardASupply,
            wallet.publicKey
        )
    }
    if (!userRewardBTokenAccount){
        userRewardBTokenAccount = await getOrCreateAssociatedTokenAccountByAnother(
            connection,
            instructions,
            wallet.publicKey,
            larixLockPool.rewardBSupply,
            wallet.publicKey
        )
    }
    stake(
        connection,
        signers,
        instructions,
        cleanupInstructions,
        program,
        LARIX_LOCK_POOL_ID,
        larixLockPool
    )
    //Need to test how many positions can be taken at a time
    for (const position of positions) {
        if ((1232-getTransactionLength(connection,wallet,instructions.concat(cleanupInstructions),signers)<51)){
            await sendTransaction(
                connection,
                wallet,
                instructions.concat(cleanupInstructions),
                signers,
                true,
            );
            instructions = []
            signers = []
            cleanupInstructions = []
        }
        claimPositionInner(
            connection,
            signers,
            instructions,
            cleanupInstructions,
            program,
            LARIX_LOCK_POOL_ID,
            larixLockPool,
            position.pubkey,
            userRewardATokenAccount,
            userRewardBTokenAccount,
        )
    }
    await sendTransaction(
        connection,
        wallet,
        instructions.concat(cleanupInstructions),
        signers,
        true,
    );
}