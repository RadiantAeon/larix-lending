import {LENDING_PROGRAM_ID} from "../constants/config"
import {
  Account,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import {
    borrowObligationLiquidityInstruction, Detail, LendingMarket,
    Obligation,
    Reserve, TokenAccount,
} from '../models';

import {getConnection, sendTransaction} from "../context/connection";
import {WalletAdapter} from "@/api/wallets";
import {findOrCreateAccountByMint} from "@/api/actions/utils/account";
import {refreshObligation} from "@/api/actions/utils/refreshObligation";
import {getObligation} from "@/api/provider/obligationProvider";

export const borrow = async (
    obligation: Detail<Obligation>,
    borrowReserve: Detail<Reserve>,
    liquidityAmount: number,
    wallet: WalletAdapter,
    allReserve:Array<Detail<Reserve>>,
    marketDetail:Detail<LendingMarket>,
    destinationLiquidity?:TokenAccount
) => {
    if (wallet.publicKey == null){
        throw new Error("wallet need connection")
    }
    if (obligation===undefined){
        const myObligations = await getObligation(wallet.publicKey,'userAction')
        if (myObligations.length>0){
            obligation = myObligations[0]
        }
    }
    const connection = await getConnection()
  const signers: Account[] = [];
  const instructions: TransactionInstruction[] = [];
    const cleanupInstructions: TransactionInstruction[] = [];

  const [lendingMarketAuthority] = await PublicKey.findProgramAddress(
    [borrowReserve.info.lendingMarket.toBuffer()],
    LENDING_PROGRAM_ID,
  );

    const destinationLiquidityPubkey = await findOrCreateAccountByMint(
        wallet.publicKey,
        wallet.publicKey,
        instructions,
        cleanupInstructions,
        borrowReserve.info.liquidity.mintPubkey,
        signers,
        destinationLiquidity
    )
    await refreshObligation(
        connection,
        signers,
        instructions,
        cleanupInstructions,
        obligation,
        allReserve,
        borrowReserve
    )
    instructions.push(
        borrowObligationLiquidityInstruction(
            liquidityAmount,
            borrowReserve.info.liquidity.supplyPubkey,
            destinationLiquidityPubkey,
            borrowReserve.pubkey,
            borrowReserve.info.liquidity.feeReceiver,
            obligation.pubkey,
            borrowReserve.info.lendingMarket,
            lendingMarketAuthority,
            obligation.info.owner,
            marketDetail.info.larixOracleProgramId,
            marketDetail.info.mineMint,
            marketDetail.info.mineSupply
        ),
    );
    return await sendTransaction(
      connection,
      wallet,
      instructions.concat(cleanupInstructions),
      signers,
      true,
  );
};
