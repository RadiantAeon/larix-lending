import {
  Account,
  Connection,
  TransactionInstruction,
} from '@solana/web3.js';
import {Detail, initObligationInstruction, LendingMarket, ObligationLayout} from '../../models';
import {createUninitializedObligationAccount} from "./account";
import {WalletAdapter} from "../../wallets";

export const initObligation = async (
    connection:Connection,
    signers: Account[],
    instructions: TransactionInstruction[],
    cleanupInstructions: TransactionInstruction[],
    wallet:WalletAdapter,
    lendingMarket:Detail<LendingMarket>
) => {
  if (wallet.publicKey == null){
    throw new Error("Wallet must be connected")
  }
    const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
        ObligationLayout.span,
    );

    const obligationAddress = createUninitializedObligationAccount(
        instructions,
        wallet.publicKey,
        accountRentExempt,
        signers
    )
    instructions.push(
      initObligationInstruction(
          obligationAddress,
          lendingMarket.pubkey,
          wallet.publicKey
      ),
    );
    return obligationAddress;
};
