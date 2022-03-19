import {Detail} from "@/api/models";
import {Position} from "@/api/models/state/position";
import {getConnection, sendTransaction} from "@/api/context/connection";
import {PublicKey, Signer, TransactionInstruction} from "@solana/web3.js";
import {stake} from "@/api/actions/utils/lock-pool/stake";
import {LARIX_LOCK_POOL_ID} from "@/api/constants/config";
import {getLarixLockPool, getLarixLockProgram} from "@/api/context/larixLock";
import {withdraw} from "@/api/actions/utils/lock-pool/withdraw";
import {getPositionsByOwner} from "@/api/provider/positionProvider";
import {
    getOrCreateAssociatedTokenAccount,
    getOrCreateAssociatedTokenAccountByAnother
} from "@/api/actions/utils/account";
import {removeLiquidity} from "@/api/actions/utils/lock-pool/removeLiquidity";
import {closePosition} from "@/api/actions/utils/lock-pool/position";

export async function withdrawPosition(
    wallet:any,
    position:Detail<Position>,
    userLpTokenAccount?:PublicKey,
    userCoinTokenAccount?:PublicKey,
    userPcTokenAccount?:PublicKey,
    userRewardATokenAccount?:PublicKey,
    userRewardBTokenAccount?:PublicKey
){
    const connection =await getConnection()
    let signers: Signer[] = [];
    let instructions: TransactionInstruction[] = [];
    let cleanupInstructions: TransactionInstruction[] = [];
    const program = await getLarixLockProgram()
    const larixLockPool = await getLarixLockPool()
    let positionId:PublicKey
    if (position){
        positionId = position.pubkey
    } else {
        const positions = await getPositionsByOwner(wallet.publicKey)
        if (positions.length>0){
            position = positions[0]
            positionId = positions[0].pubkey
        } else {
            throw new Error("No position can withdraw")
        }
    }
    if (!userCoinTokenAccount){
        userCoinTokenAccount = await getOrCreateAssociatedTokenAccountByAnother(
            connection,
            instructions,
            wallet.publicKey,
            larixLockPool.coinSupply,
            wallet.publicKey
        )
    }
    if (!userPcTokenAccount){
        userPcTokenAccount = await getOrCreateAssociatedTokenAccountByAnother(
            connection,
            instructions,
            wallet.publicKey,
            larixLockPool.pcSupply,
            wallet.publicKey
        )
    }
    if (!userLpTokenAccount){
        userLpTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            instructions,
            wallet.publicKey,
            larixLockPool.lpMint,
            wallet.publicKey
        )
    }
    if (!userRewardATokenAccount) {
        if (larixLockPool.coinSupply.equals(larixLockPool.rewardASupply)) {
            userRewardATokenAccount = userCoinTokenAccount
        } else if (larixLockPool.pcSupply.equals(larixLockPool.rewardASupply)) {
            userRewardATokenAccount = userPcTokenAccount
        } else {
            userRewardATokenAccount = await getOrCreateAssociatedTokenAccountByAnother(
                connection,
                instructions,
                wallet.publicKey,
                larixLockPool.rewardASupply,
                wallet.publicKey
            )
        }
    }
    if (!userRewardBTokenAccount){
        userRewardBTokenAccount = userCoinTokenAccount
        // if (larixLockPool.coinSupply.equals(larixLockPool.rewardBSupply)){
        //     userRewardBTokenAccount = userCoinTokenAccount
        // } else if (larixLockPool.pcSupply.equals(larixLockPool.rewardBSupply)){
        //     userRewardBTokenAccount = userPcTokenAccount
        // } else {
        //     userRewardBTokenAccount = await getOrCreateAssociatedTokenAccountByAnother(
        //         connection,
        //         instructions,
        //         wallet.publicKey,
        //         larixLockPool.rewardBSupply,
        //         wallet.publicKey
        //     )
        // }
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
    withdraw(
        connection,
        signers,
        instructions,
        cleanupInstructions,
        program,
        LARIX_LOCK_POOL_ID,
        larixLockPool,
        positionId,
        userLpTokenAccount,
        userRewardATokenAccount,
        userRewardBTokenAccount,
    )
    closePosition(
        connection,
        signers,
        instructions,
        cleanupInstructions,
        program,
        positionId,
        wallet.publicKey,
        wallet.publicKey
    )
    await sendTransaction(
        connection,
        wallet,
        instructions.concat(cleanupInstructions),
        signers,
        true,
    );
    instructions = []
    cleanupInstructions = []
    signers = []
    removeLiquidity(
        connection,
        signers,
        instructions,
        cleanupInstructions,
        userLpTokenAccount,
        userCoinTokenAccount,
        userPcTokenAccount,
        wallet.publicKey,
        position.info.lpAmount
    )
    await sendTransaction(
        connection,
        wallet,
        instructions.concat(cleanupInstructions),
        signers,
        true,
    );
}