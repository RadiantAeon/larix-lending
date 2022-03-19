import {
    Account,
    PublicKey,
    TransactionInstruction,
} from '@solana/web3.js';

import {getConnection, sendTransaction} from "../context/connection";

import {Detail,TokenAccount} from "@/api/models";
import {
    LARIX_LOCK_POOL_ID,
} from "@/api/constants/config";

import {UserLarixInfo} from "@/api/models/state/userLarixInfo";
import {getUserLarixInfoByOwner} from "@/api/provider/userLarixInfoProvider";
import {createUserLarixInfo} from "@/api/actions/utils/lock-pool/userLarixInfo";
import {getLarixLockPool, getLarixLockProgram} from "@/api/context/larixLock";
import {addLiquidity} from "@/api/actions/utils/lock-pool/addLiquidity";
import {LarixLockPool} from "@/api/models/state/larixLockPool";
import {createPosition} from "@/api/actions/utils/lock-pool/position";
import {stake} from "@/api/actions/utils/lock-pool/stake";

export const stakeLarixUserInfo = async (
    usdcTokenAccount:TokenAccount,
    wallet:any,
    userLarixInfoAccount?:Detail<UserLarixInfo>
) => {
    if (!userLarixInfoAccount){
        const userLarixInfoAccounts = await getUserLarixInfoByOwner(wallet.publicKey)
        if (userLarixInfoAccounts.length>0){
            userLarixInfoAccount = userLarixInfoAccounts[0]
        }
    }
    const connection =await getConnection()
    const signers: Account[] = [];
    const instructions: TransactionInstruction[] = [];
    const cleanupInstructions: TransactionInstruction[] = [];

    const program = await getLarixLockProgram()
    const larixLockPool:LarixLockPool = await getLarixLockPool()
    let userLarixInfoPublicKey:PublicKey|undefined
    if (!userLarixInfoAccount){
        userLarixInfoPublicKey = createUserLarixInfo(
            connection,
            signers,
            instructions,
            cleanupInstructions,
            program,
            LARIX_LOCK_POOL_ID,
            wallet.publicKey,
            wallet.publicKey
        )
    } else {
        userLarixInfoPublicKey = userLarixInfoAccount.pubkey
    }
    const position = createPosition(
        connection,
        signers,
        instructions,
        cleanupInstructions,
        program,
        LARIX_LOCK_POOL_ID,
        wallet.publicKey,
        wallet.publicKey
    )
    stake(
        connection,
        signers,
        instructions,
        cleanupInstructions,
        program,
        LARIX_LOCK_POOL_ID,
        larixLockPool
    )
    addLiquidity(
        connection,
        signers,
        instructions,
        cleanupInstructions,
        program,
        LARIX_LOCK_POOL_ID,
        larixLockPool,
        userLarixInfoPublicKey,
        position,
        wallet.publicKey,
        usdcTokenAccount.pubkey
    )
    stake(
        connection,
        signers,
        instructions,
        cleanupInstructions,
        program,
        LARIX_LOCK_POOL_ID,
        larixLockPool
    )
    return await sendTransaction(
        connection,
        wallet,
        instructions.concat(cleanupInstructions),
        signers,
        true,
    );
};
