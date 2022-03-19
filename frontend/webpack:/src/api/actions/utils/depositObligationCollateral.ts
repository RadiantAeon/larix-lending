import {
    LENDING_PROGRAM_ID
} from "../../constants/config"
import {
    Account,
    Connection,
    PublicKey,
    TransactionInstruction,
} from '@solana/web3.js';
import {
    depositObligationCollateralInstruction, Detail, Obligation,
    Reserve
} from '../../models';

import {WalletAdapter} from "../../wallets";
import BN from "bn.js";

export const depositObligationCollateral = async (
    connection: Connection,
    signers: Account[],
    instructions: TransactionInstruction[],
    cleanupInstructions: TransactionInstruction[],
    wallet: WalletAdapter,
    collateralAmount: BN,
    sourceCollateral: PublicKey,
    depositReserveDetail: Detail<Reserve>,
    obligation: Detail<Obligation>,
) => {
    if (wallet.publicKey == null) {
        throw new Error("wallet need connection")
    }
    const depositReserve = depositReserveDetail.info;
    const depositReserveAddress = depositReserveDetail.pubkey
    // user from account
    const [lendingMarketAuthority] = await PublicKey.findProgramAddress(
        [depositReserve.lendingMarket.toBuffer()],
        LENDING_PROGRAM_ID,
    );
    const appendReserves: PublicKey[] = []
    obligation.info.deposits.map(deposit => {
        if (deposit.depositReserve.equals(depositReserveAddress)) {
            obligation.info.deposits.map(deposit2 => {
                appendReserves.push(deposit2.depositReserve)
            })
            obligation.info.borrows.map(borrow => {
                appendReserves.push(borrow.borrowReserve)
            })
        }
    })

    instructions.push(
        depositObligationCollateralInstruction(
            collateralAmount,
            sourceCollateral,
            depositReserve.collateral.supplyPubkey,
            depositReserveAddress,
            obligation.pubkey,
            depositReserve.lendingMarket,
            lendingMarketAuthority,
            // @FIXME: wallet must sign
            wallet.publicKey,
            wallet.publicKey,
            appendReserves
        ),
    );
};
