import {Detail, Obligation, Reserve, TokenAccount} from "@/api/models";
import {Account, TransactionInstruction} from "@solana/web3.js";
import {WalletAdapter} from "@/api/wallets";
import {withdrawObligationCollateral} from "@/api/actions/utils/withdrawObligationCollateral";

import {U64_MAX} from "@/api/constants/math";
import {getConnection, sendTransaction} from "@/api/context/connection";
import {Mining} from "@/api/models/state/mining";
import {depositMining} from "@/api/actions/utils/depositMing";
import {refreshReserve} from "@/api/actions/utils/refreshReserve";
import {getObligation} from "@/api/provider/obligationProvider";
import {getMining} from "@/api/provider/miningProvider";
import openTxDialog from "@/controller/openTxDialog";
import {getOrCreateAssociatedTokenAccount} from "@/api/actions/utils/account";


export const exitObligation = async (
    obligationDetail: Detail<Obligation>,
    destinationCollateral:TokenAccount,
    detailReserve:Detail<Reserve>,
    wallet: WalletAdapter,
    allReserve:Array<Detail<Reserve>>,
    mining:Detail<Mining>,
)=>{
    if (wallet.publicKey == null || wallet.publicKey == undefined){
        throw new Error("Wallet need connected")
    }
    const connection = await getConnection()
    openTxDialog()
    let signers: Account[] = [];
    let instructions: TransactionInstruction[] = [];
    let cleanupInstructions: TransactionInstruction[] = [];
    if (mining===undefined){
        const myMinings = await getMining(wallet.publicKey,'userAction')
        if (myMinings.length>0){
            mining = myMinings[0]
        }
    }
    if (obligationDetail===undefined){
        const myObligations = await getObligation(wallet.publicKey,'userAction')
        if (myObligations.length>0){
            obligationDetail = myObligations[0]
        }
    }
    let destinationCollateralAddress;
    if (destinationCollateral == undefined){
        destinationCollateralAddress = await getOrCreateAssociatedTokenAccount(
            connection,
            instructions,
            wallet.publicKey,
            detailReserve.info.collateral.mintPubkey,
            wallet.publicKey,
        )
        await sendTransaction(
            connection,
            wallet,
            instructions.concat(cleanupInstructions),
            signers,
            true,
        );
        signers = [];
        instructions = [];
        cleanupInstructions = [];
    } else {
        destinationCollateralAddress = destinationCollateral.pubkey
    }
    await withdrawObligationCollateral(
        connection,
        signers,
        instructions,
        cleanupInstructions,
        obligationDetail,
        U64_MAX,
        destinationCollateralAddress,
        detailReserve,
        wallet,
        allReserve
    )
    if (obligationDetail.info.deposits.length+obligationDetail.info.borrows.length>=4){
        await sendTransaction(
            connection,
            wallet,
            instructions.concat(cleanupInstructions),
            signers,
            true,
        );
        signers = [];
        instructions = [];
        cleanupInstructions = [];
    }
    await refreshReserve(
        connection,
        signers,
        instructions,
        cleanupInstructions,
        detailReserve
    )
    await depositMining(
        connection,
        signers,
        instructions,
        cleanupInstructions,
        destinationCollateralAddress,
        detailReserve,
        U64_MAX,
        wallet,
        detailReserve.info.lendingMarket,
        mining.pubkey
    )
    return  await sendTransaction(
        connection,
        wallet,
        instructions.concat(cleanupInstructions),
        signers,
        true,
    );
}