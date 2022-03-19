import {
    Account, Connection,
    PublicKey,
    TransactionInstruction,
} from '@solana/web3.js';
import {getConnection, getTransactionLength, sendTransaction} from "../context/connection";
import {
    Detail,
    LendingMarket,
    Obligation,
    ObligationCollateral,
    refreshReservesInstruction,
    Reserve,
} from "@/api/models";
import {
    LENDING_PROGRAM_ID,
    LP_RESERVE_ID_ARRAY
} from "@/api/constants/config";

import {Mining, MiningIndex} from "@/api/models/state/mining";
import {getOrCreateAssociatedTokenAccount} from "@/api/actions/utils/account";
import {getObligation} from "@/api/provider/obligationProvider";
import {getMining} from "@/api/provider/miningProvider";
import {getAllReserveOfObligation} from "@/api/actions/utils/getAllReserveOfObligation";
import {getAllReserveOfMining} from "@/api/actions/utils/getAllReserveOfMining";
import {refreshBridgePool, refreshReserves} from "@/api/actions/utils/refreshReserves";
import {refreshMining} from "@/api/actions/utils/refreshMining";
import {claimMineInner} from "@/api/actions/utils/lock-pool/claimMineInner";
import {Params} from "@/api/models/instructions/larix-lock-pool/claimMine";
import {refreshObligationOnly} from "@/api/actions/utils/refreshObligationOnly";
import {hasLp} from "@/api/utils/util";
import {publicKey} from "@/api/utils/layout";



export const claimMine = async (
    mining:Detail<Mining>,
    obligation:Detail<Obligation>,
    wallet:any,
    lendingMarket:Detail<LendingMarket>,
    allReserve:Detail<Reserve>[],
    claimRatio:number,
    larixAssociatedTokenAccount?:PublicKey,
) => {
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

    const connection =await getConnection()
    let signers: Account[] = [];
    let instructions: TransactionInstruction[] = [];
    let cleanupInstructions: TransactionInstruction[] = [];
    if (larixAssociatedTokenAccount==undefined){
        larixAssociatedTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            instructions,
            wallet.publicKey,
            lendingMarket.info.mineMint,
            wallet.publicKey,
        )
    }
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
    claimMineInner(
        connection,
        signers,
        instructions,
        cleanupInstructions,
        lendingMarket.pubkey,
        lendingMarketAuthority,
        mining.pubkey,
        wallet,
        100,
        claimRatio,
        {
            obligation:obligation?obligation.pubkey:undefined,
            destination:larixAssociatedTokenAccount,
            sourceAccount:lendingMarket.info.mineSupply
        } as Params
    )
    return await sendTransaction(
        connection,
        wallet,
        instructions.concat(cleanupInstructions),
        signers,
        true,
    );
};
export const claimMineRefreshReserves = async (
    instructions: TransactionInstruction[],
    cleanupInstructions:TransactionInstruction[],
    signers:Account[],
    connection:Connection,
    wallet:any,
    lpReserve:Array<Detail<Reserve>>,
    singleTokenReserve:Array<Detail<Reserve>>,
) =>{
    if (lpReserve.length===0&&singleTokenReserve.length===0){
        return
    }
    if (lpReserve.length>0){
        if (lpReserve.length>=2)
        {
            const startReserves = lpReserve.slice(0,2)
            await refreshBridgePool(instructions,startReserves)
            instructions.push(refreshReservesInstruction(
                startReserves
            ))
            await sendTransaction(
                connection,
                wallet,
                instructions.concat(cleanupInstructions),
                signers,
                true,
            );
            while (instructions.length>0){
                instructions.pop()
            }
            cleanupInstructions = []
            signers = []
            const endReserves = lpReserve.slice(2,lpReserve.length)
            if (endReserves.length>0){
                await claimMineRefreshReserves(
                    instructions,
                    cleanupInstructions,
                    signers,
                    connection,
                    wallet,
                    endReserves,
                    singleTokenReserve
                )
            }
        }else {
            await refreshBridgePool(instructions,lpReserve)
            instructions.push(refreshReservesInstruction(
                lpReserve
            ))
        }
    }
    if (singleTokenReserve.length>0){
        await refreshReserves(
            instructions,
            singleTokenReserve
        )
    }
}