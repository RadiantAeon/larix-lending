import {
    Account,
    PublicKey,
    TransactionInstruction,
} from '@solana/web3.js';

import {getConnection, getTransactionLength, sendTransaction} from "../context/connection";

import {Detail, LendingMarket, Obligation, ObligationCollateral, Reserve, TokenAccount} from "@/api/models";
import {
    LARIX_LOCK_POOL_ID,
    LARIX_LOCK_PROGRAM_ID,
    LENDING_PROGRAM_ID,
    LP_RESERVE_ID_ARRAY
} from "@/api/constants/config";

import {Mining} from "@/api/models/state/mining";
import {getObligation} from "@/api/provider/obligationProvider";
import {getMining} from "@/api/provider/miningProvider";
import {getAllReserveOfObligation} from "@/api/actions/utils/getAllReserveOfObligation";
import {getAllReserveOfMining} from "@/api/actions/utils/getAllReserveOfMining";
import {refreshReserves} from "@/api/actions/utils/refreshReserves";
import {refreshMining} from "@/api/actions/utils/refreshMining";
import {claimMineInner} from "@/api/actions/utils/lock-pool/claimMineInner";
import {Params} from "@/api/models/instructions/larix-lock-pool/claimMine";
import {UserLarixInfo} from "@/api/models/state/userLarixInfo";
import {getUserLarixInfoByOwner} from "@/api/provider/userLarixInfoProvider";
import {closeUserLarixInfo, createUserLarixInfo} from "@/api/actions/utils/lock-pool/userLarixInfo";
import {getLarixLockPool, getLarixLockProgram} from "@/api/context/larixLock";
import {addLiquidity} from "@/api/actions/utils/lock-pool/addLiquidity";
import {LarixLockPool} from "@/api/models/state/larixLockPool";
import {createPosition} from "@/api/actions/utils/lock-pool/position";
import {stake} from "@/api/actions/utils/lock-pool/stake";
import {refreshObligationOnly} from "@/api/actions/utils/refreshObligationOnly";
import { claimMineRefreshReserves } from './claimMine';
import {hasLp} from "@/api/utils/util";

export const claimMineAndStake = async (
    mining:Detail<Mining>,
    obligation:Detail<Obligation>,
    usdcTokenAccount:TokenAccount,
    wallet:any,
    lendingMarket:Detail<LendingMarket>,
    allReserve:Detail<Reserve>[],
    claimTimes:number,
    claimRatio:number,
    larixDestination?:TokenAccount,
    userLarixInfoAccount?:Detail<UserLarixInfo>
) => {
    if (claimTimes == 100){
        throw new Error("Subsidy times must great than zero")
    }
    if (userLarixInfoAccount && userLarixInfoAccount.info.larixAmount.isZero()){
        throw new Error("Larix amount of user larix info can not be zero")
    }
    if (!mining){
        const myMinings = await getMining(wallet.publicKey,'userAction')
        if (myMinings.length>0){
            mining = myMinings[0]
        }
    }
    if (!obligation){
        const myObligations = await getObligation(wallet.publicKey,'userAction')
        if (myObligations.length>0){
            obligation = myObligations[0]
        }
    }
    if (!userLarixInfoAccount){
        const userLarixInfoAccounts = await getUserLarixInfoByOwner(wallet.publicKey)
        if (userLarixInfoAccounts.length>0){
            userLarixInfoAccount = userLarixInfoAccounts[0]
        }
    }
    const connection =await getConnection()
    let signers: Account[] = [];
    let instructions: TransactionInstruction[] = [];
    let cleanupInstructions: TransactionInstruction[] = [];

    const miningReserveSet = new Set<Detail<Reserve>>()
    const obligationReserveSet = new Set<Detail<Reserve>>()
    getAllReserveOfMining(mining,allReserve,miningReserveSet)
    const refreshMiningReserveArray = new Array<Detail<Reserve>>();
    const refreshObligationReserveArray = new Array<Detail<Reserve>>();
    miningReserveSet.forEach((reserve)=>{
        refreshMiningReserveArray.push(reserve)
    });
    const LP_RESERVE = [] as Array<Detail<Reserve>>
    const SINGLE_TOKEN_RESERVE = [] as Array<Detail<Reserve>>
    refreshMiningReserveArray.forEach((reserve)=>{
        if (LP_RESERVE_ID_ARRAY.includes(reserve.pubkey.toString())){
            LP_RESERVE.push(reserve)
        }else {
            SINGLE_TOKEN_RESERVE.push(reserve)
        }
    })
    await claimMineRefreshReserves(
        instructions,
        cleanupInstructions,
        signers,
        connection,
        wallet,
        LP_RESERVE,
        SINGLE_TOKEN_RESERVE
    )
    await refreshMining(
        connection,
        signers,
        instructions,
        cleanupInstructions,
        mining
    )
    const {miningLpLength,obligationLpLength} = hasLp(obligation,mining)
    if ((miningLpLength+1)%2===0&&obligationLpLength===1){
        console.log('can not concat all instructions')
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
    }
    getAllReserveOfObligation(obligation,allReserve,obligationReserveSet)
    obligationReserveSet.forEach((reserve)=>{
        refreshObligationReserveArray.push(reserve)
    });
    await refreshReserves(
        instructions,
        refreshObligationReserveArray
    )
    await refreshObligationOnly(
        connection,
        signers,
        instructions,
        cleanupInstructions,
        obligation
    )
    if (1232-getTransactionLength(connection,wallet,instructions.concat(cleanupInstructions),signers)<400){
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
    }
    const [lendingMarketAuthority] = await PublicKey.findProgramAddress(
        [lendingMarket.pubkey.toBuffer()],
        LENDING_PROGRAM_ID,
    );
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
    claimMineInner(
        connection,
        signers,
        instructions,
        cleanupInstructions,
        lendingMarket.pubkey,
        lendingMarketAuthority,
        mining.pubkey,
        wallet,
        claimTimes,
        claimRatio,
        {
            obligation:obligation?obligation.pubkey:undefined,
            destination:larixDestination?.pubkey,
            sourceAccount:lendingMarket.info.mineSupply,
            larixLockProgram:LARIX_LOCK_PROGRAM_ID,
            larixLockPool:LARIX_LOCK_POOL_ID,
            userLarixInfoAccount:userLarixInfoPublicKey
        } as Params
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
    // closeUserLarixInfo(
    //     connection,
    //     signers,
    //     instructions,
    //     cleanupInstructions,
    //     program,
    //     userLarixInfoPublicKey,
    //     wallet.publicKey,
    //     wallet.publicKey
    // )
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
