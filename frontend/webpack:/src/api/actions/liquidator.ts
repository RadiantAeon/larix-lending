import {LENDING_PROGRAM_ID} from "../constants/config"
import {
    Account,
    PublicKey,
    TransactionInstruction,
} from '@solana/web3.js';
import {
    Detail,
    Obligation,
    Reserve, TokenAccount,
} from '../models';

import {getConnection, sendTransaction} from "../context/connection";
import {WalletAdapter} from "@/api/wallets";
import {ensureSplAccount, findOrCreateAccountByMint} from "@/api/actions/utils/account";
import {refreshObligation} from "@/api/actions/utils/refreshObligation";
import BN from "bn.js";
import {createLiquidateInstruction} from "@/api/models/instructions/liquidate";
import {redeemReserveCollateral} from "@/api/actions/utils/redeemReserveCollateral";
import {U64_MAX} from "@/api/constants/math";
import {Token} from "@solana/spl-token";

// @FIXME
export const liquidate = async (
    liquidityAmount:BN,
    obligation: Detail<Obligation>,
    repayReserve: Detail<Reserve>,
    withdrawReserve:Detail<Reserve>,
    wallet: WalletAdapter,
    allReserve:Array<Detail<Reserve>>,
    sourceAccount:TokenAccount,
    destinationCollateralAccount?:TokenAccount,
    destinationLiquidityAccount?:TokenAccount
) => {
    if (wallet.publicKey == null){
        throw new Error("wallet need connection")
    }
    // openTxDialog('updateBorrowDialogVisible')

    if (sourceAccount == undefined){
        throw new Error("No liquidate token balance")
    }

    const connection = await getConnection()
    let signers: Account[] = [];
    let instructions: TransactionInstruction[] = [];
    let cleanupInstructions: TransactionInstruction[] = [];
    const balanceNeeded = await Token.getMinBalanceRentForExemptAccount(connection)
    const sourcePubkey = ensureSplAccount(
        instructions,
        cleanupInstructions,
        sourceAccount,
        wallet.publicKey,
        liquidityAmount.toNumber()+balanceNeeded,
        signers
    )
    const [lendingMarketAuthority] = await PublicKey.findProgramAddress(
        [repayReserve.info.lendingMarket.toBuffer()],
        LENDING_PROGRAM_ID,
    );
    console.log(instructions)
    const destinationCollateralAddress = await findOrCreateAccountByMint(
        wallet.publicKey,
        wallet.publicKey,
        instructions,
        cleanupInstructions,
        withdrawReserve.info.collateral.mintPubkey,
        signers,
        destinationCollateralAccount
    )
    if (instructions.length>0){
        await sendTransaction(
            connection,
            wallet,
            instructions,
            signers,
            true,
        );
        signers = [];
        instructions = [];
    }
    await refreshObligation(
        connection,
        signers,
        instructions,
        cleanupInstructions,
        obligation,
        allReserve
    )
    instructions.push(
        createLiquidateInstruction(
            liquidityAmount,
            sourcePubkey,
            destinationCollateralAddress,
            repayReserve.pubkey,
            repayReserve.info.liquidity.supplyPubkey,
            withdrawReserve.pubkey,
            withdrawReserve.info.collateral.supplyPubkey,
            obligation.pubkey,
            repayReserve.info.lendingMarket,
            lendingMarketAuthority,
            wallet.publicKey,
        )
    );
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
    const destinationLiquidityPubkey = await findOrCreateAccountByMint(
        wallet.publicKey,
        wallet.publicKey,
        instructions,
        cleanupInstructions,
        withdrawReserve.info.liquidity.mintPubkey,
        signers,
        destinationLiquidityAccount
    )
    await redeemReserveCollateral(
        connection,
        signers,
        instructions,
        cleanupInstructions,
        destinationCollateralAddress,
        U64_MAX,
        wallet,
        withdrawReserve,
        destinationLiquidityPubkey,
        undefined
    )
    return await sendTransaction(
        connection,
        wallet,
        instructions.concat(cleanupInstructions),
        signers,
        true,
    );
};
