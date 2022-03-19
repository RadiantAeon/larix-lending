import {
    Account,
    Connection,
    PublicKey, Signer,
    TransactionInstruction,
} from '@solana/web3.js';
import {LENDING_PROGRAM_ID} from "../../constants/config"
import {
    withdrawObligationCollateralInstruction,
    Reserve,
    Detail,
    Obligation,
} from '../../models';
import {WalletAdapter} from "../../wallets";
import BN from "bn.js";
import {refreshObligation} from "./refreshObligation";
import {refreshReserves} from "./refreshReserves";

export const withdrawObligationCollateral = async (
    connection: Connection,
    signers: Signer[],
    instructions: TransactionInstruction[],
    cleanupInstructions: TransactionInstruction[],
    obligationDetail: Detail<Obligation>,
    collateralAmount: BN,
    destinationCollateral: PublicKey,
    withdrawReserveDetail: Detail<Reserve>,
    wallet: WalletAdapter,
    allReserve: Array<Detail<Reserve>>
) => {
    if (wallet.publicKey == null) {
        throw new Error("wallet need connection")
    }
    const withdrawReserve = withdrawReserveDetail.info
    const reserveAddress = withdrawReserveDetail.pubkey
    const [lendingMarketAuthority] = await PublicKey.findProgramAddress(
        [withdrawReserve.lendingMarket.toBuffer()],
        LENDING_PROGRAM_ID,
    );
    if (obligationDetail.info.borrows.length > 0) {
        await refreshObligation(
            connection,
            signers,
            instructions,
            cleanupInstructions,
            obligationDetail,
            allReserve
        )
    } else {
        await refreshReserves(
            instructions,
            [withdrawReserveDetail]
        )
    }

    instructions.push(
        withdrawObligationCollateralInstruction(
            collateralAmount,
            withdrawReserve.collateral.supplyPubkey,
            destinationCollateral,
            reserveAddress,
            obligationDetail.pubkey,
            withdrawReserve.lendingMarket,
            lendingMarketAuthority,
            wallet.publicKey
        ),
    );
};
