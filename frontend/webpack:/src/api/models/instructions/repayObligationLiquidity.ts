import { LENDING_PROGRAM_ID, TOKEN_PROGRAM_ID } from '../../constants/config';
import {
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import BN from 'bn.js';
import * as BufferLayout from 'buffer-layout';
import * as Layout from '../../utils/layout';
import { LendingInstruction } from './instruction';

export const repayObligationLiquidityInstruction = (
  liquidityAmount: number | BN,
  sourceLiquidity: PublicKey,
  destinationLiquidity: PublicKey,
  repayReserve: PublicKey,
  obligation: PublicKey,
  lendingMarket: PublicKey,
  // lendingMarketAuthority: PublicKey,
  transferAuthority: PublicKey,
): TransactionInstruction => {
  const dataLayout = BufferLayout.struct([
    BufferLayout.u8('instruction'),
    Layout.uint64('liquidityAmount'),
  ]);
  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: LendingInstruction.RepayObligationLiquidity,
      liquidityAmount: new BN(liquidityAmount),
    },
    data,
  );

  const keys = [
    { pubkey: sourceLiquidity, isSigner: false, isWritable: true },
    { pubkey: destinationLiquidity, isSigner: false, isWritable: true },
    { pubkey: repayReserve, isSigner: false, isWritable: true },

    { pubkey: obligation, isSigner: false, isWritable: true },
    { pubkey: lendingMarket, isSigner: false, isWritable: false },
    { pubkey: transferAuthority, isSigner: true, isWritable: false },

    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({
    keys,
    programId: LENDING_PROGRAM_ID,
    data,
  });
};
