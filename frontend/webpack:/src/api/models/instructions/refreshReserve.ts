import { LENDING_PROGRAM_ID } from '../../constants/config';
import {
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import * as BufferLayout from 'buffer-layout';
import { LendingInstruction } from './instruction';

export const refreshReserveInstruction = (
  reserve: PublicKey,
  oracle: PublicKey,
): TransactionInstruction => {
  const dataLayout = BufferLayout.struct([BufferLayout.u8('instruction')]);

  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode({ instruction: LendingInstruction.RefreshReserve }, data);

  const keys = [
    { pubkey: reserve, isSigner: false, isWritable: true },
    {pubkey: oracle, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
  ];



  return new TransactionInstruction({
    keys,
    programId: LENDING_PROGRAM_ID,
    data,
  });
};
