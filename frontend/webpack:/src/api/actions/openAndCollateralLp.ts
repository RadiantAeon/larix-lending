import {
    depositObligationCollateralInstruction,
    Detail,
    LendingMarket,
    Obligation,
    Reserve,
    TokenAccount
} from "@/api/models";

import {WalletAdapter} from "@/api/wallets";
import {Account, PublicKey, TransactionInstruction} from "@solana/web3.js";
import {getConnection, sendTransaction} from "@/api/context/connection";
import {LENDING_PROGRAM_ID} from "@/api/constants/config";
import {withdrawMining} from "@/api/actions/utils/withdrawMining";
import {U64_MAX} from "@/api/constants/math";
import {refreshReserve} from "@/api/actions/utils/refreshReserve";
import {initObligation} from "@/api/actions/utils/initObligation";
import {Mining} from "@/api/models/state/mining";
import {getMining} from "@/api/provider/miningProvider";
import openTxDialog from "@/controller/openTxDialog";

/**
 *
 * @param depositReserveDetail
 * @param wallet
 * @param lendingMarket
 */
export async function openAndCollateralLp(
    depositReserveDetail:Detail<Reserve>,
    wallet:WalletAdapter,
    lendingMarket:Detail<LendingMarket>,
    collAccount:TokenAccount,
    mining:Detail<Mining>,
    allReserve:Detail<Reserve>[],

){
    if (wallet.publicKey == null){
        throw new Error("Wallet need connected")
    }
    openTxDialog()
    const connection = await getConnection();

    const depositReserveAddress = depositReserveDetail.pubkey
    // user from account
    const signers: Account[] = [];
    const instructions: TransactionInstruction[] = [];
    const cleanupInstructions: TransactionInstruction[] = [];
    if (mining===undefined){
        const myMinings = await getMining(wallet.publicKey,'userAction')
        if (myMinings.length>0){
            mining = myMinings[0]
        }
    }
    const appendReserves: PublicKey[] = []
    const myObligationAddress = await initObligation(
        connection,
        signers,
        instructions,
        cleanupInstructions,
        wallet,
        lendingMarket
    )
    await refreshReserve(
        connection,
        signers,
        instructions,
        cleanupInstructions,
        depositReserveDetail
    )
    mining.info.miningIndices.map(async (miningIndex) => {
        if (miningIndex.reserve.equals(depositReserveDetail.pubkey)) {
            await withdrawMining(
                connection,
                signers,
                instructions,
                cleanupInstructions,
                mining.pubkey,
                collAccount.pubkey,
                depositReserveDetail,
                U64_MAX,
                wallet,
                lendingMarket.pubkey
            )
        }
    })

    const [lendingMarketAuthority] = await PublicKey.findProgramAddress(
        [lendingMarket.pubkey.toBuffer()],
        LENDING_PROGRAM_ID,
    );

    await refreshReserve(
        connection,
        signers,
        instructions,
        cleanupInstructions,
        depositReserveDetail
    )
    instructions.push(
        depositObligationCollateralInstruction(
            U64_MAX,
            collAccount.pubkey,
            depositReserveDetail.info.collateral.supplyPubkey,
            depositReserveAddress,
            myObligationAddress,
            lendingMarket.pubkey,
            lendingMarketAuthority,
            wallet.publicKey,
            wallet.publicKey,
            appendReserves
        ),
    );
    return  await sendTransaction(
        connection,
        wallet,
        instructions.concat(cleanupInstructions),
        signers,
        true,
    )
}