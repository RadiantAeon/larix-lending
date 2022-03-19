
import {
  Account,
  Connection,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  depositReserveLiquidityInstruction, Detail,
  Reserve,
} from '../../models';
import {LENDING_PROGRAM_ID} from "../../constants/config";

import {getOrCreateAssociatedTokenAccount} from "./account"
import {WalletAdapter} from "../../wallets";
import BN from "bn.js";


export const depositReserveLiquidity = async (
    connection:Connection,
    signers: Account[],
    instructions: TransactionInstruction[],
    cleanupInstructions: TransactionInstruction[],
    source: PublicKey,
    liquidityAmount: BN,
    wallet: WalletAdapter,
    detailReserve: Detail<Reserve>,
    destinationCollateralAccount?:PublicKey,

) => {
  if (wallet.publicKey == null){
      throw new Error("Wallet need connected")
  }

  const reserve = detailReserve.info
  const reserveAddress = detailReserve.pubkey
  // user from account


  const [lendingMarketAuthority] = await PublicKey.findProgramAddress(
    [reserve.lendingMarket.toBuffer()], // which account should be authority
    LENDING_PROGRAM_ID,
  );
  if (destinationCollateralAccount==undefined){
    destinationCollateralAccount = await getOrCreateAssociatedTokenAccount(
         connection,
        instructions,
        wallet.publicKey,
        reserve.collateral.mintPubkey,
        wallet.publicKey,
    )
  }
  instructions.push(
    depositReserveLiquidityInstruction(
      liquidityAmount,
      source,
      destinationCollateralAccount,
      reserveAddress,
      reserve.liquidity.supplyPubkey,
      reserve.collateral.mintPubkey,
      reserve.lendingMarket,
      lendingMarketAuthority,
      wallet.publicKey
    ),
  );
  return destinationCollateralAccount
};
