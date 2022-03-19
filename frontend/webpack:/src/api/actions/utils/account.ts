import {AccountLayout, ASSOCIATED_TOKEN_PROGRAM_ID, MintLayout, Token} from '@solana/spl-token';
import {
    Account, Connection,
    PublicKey, Signer,
    SystemProgram,
    TransactionInstruction,
} from '@solana/web3.js';
import {
    LENDING_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    WRAPPED_SOL_MINT,
} from '../../constants/config';
import {ObligationLayout, TokenAccount, TokenAccountParser} from '../../models';
import {MiningLayout} from "../../models/state/mining";
import {getAccountInfo} from "../../provider/accounts";
import {getConnection} from "../../context/connection";
import {getTokenAccount} from "@/api/provider/tokenAccount";

/**
 * @param instructions
 * @param cleanupInstructions
 * @param toCheck
 * @param payer
 * @param amount
 * @param signers
 */
export function ensureSplAccount(
    instructions: TransactionInstruction[],
    cleanupInstructions: TransactionInstruction[],
    toCheck: TokenAccount,
    payer: PublicKey,
    amount: number,
    signers: Account[]
) {
    if (!toCheck.info.isNative) {
        return toCheck.pubkey;
    }

    const account = createUninitializedAccount(
        instructions,
        payer,
        amount,
        signers
    );
    instructions.push(
        Token.createInitAccountInstruction(
            TOKEN_PROGRAM_ID,
            WRAPPED_SOL_MINT,
            account,
            payer
        )
    );
    cleanupInstructions.push(
        Token.createCloseAccountInstruction(
            TOKEN_PROGRAM_ID,
            account,
            payer,
            payer,
            []
        )
    );

    return account;
}
export function createUninitializedAccount(
  instructions: TransactionInstruction[],
  payer: PublicKey,
  amount: number,
  signers: Account[],
) {
  const account = new Account();
  instructions.push(
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: account.publicKey,
      lamports: amount,
      space: AccountLayout.span,
      programId: TOKEN_PROGRAM_ID,
    }),
  );

  signers.push(account);

  return account.publicKey;
}
export async function getOrCreateAssociatedTokenAccountByAnother(
    connection:Connection,
    instructions: TransactionInstruction[],
    payer: PublicKey,
    another: PublicKey,
    owner: PublicKey,
):Promise<PublicKey>{
    const anotherTokenAccount = await getTokenAccount(another)
    return await getOrCreateAssociatedTokenAccount(
        connection,
        instructions,
        payer,
        anotherTokenAccount.mint,
        owner
    )
}

export async function getOrCreateAssociatedTokenAccount(
    connection:Connection,
  instructions: TransactionInstruction[],
  payer: PublicKey,
  mint: PublicKey,
  owner: PublicKey,
) {
    const associatedTokenAccount = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        mint,
        owner
    )
    const accountInfo = await getAccountInfo(connection,associatedTokenAccount)
    if (accountInfo==null){
        instructions.push(Token.createAssociatedTokenAccountInstruction(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            mint,
            associatedTokenAccount,
            owner,
            owner
        ))
    }

  return associatedTokenAccount;
}
export function createUninitializedObligationAccount(
    instructions: TransactionInstruction[],
    payer: PublicKey,
    amount: number,
    signers: Account[],
){
  const account = new Account();
  instructions.push(
      SystemProgram.createAccount({
        fromPubkey: payer,
        newAccountPubkey: account.publicKey,
        lamports: amount,
        space: ObligationLayout.span,
        programId: LENDING_PROGRAM_ID,
      }),
  );

  signers.push(account);

  return account.publicKey;
}
export function createUninitializedMiningAccount(
    instructions: TransactionInstruction[],
    payer: PublicKey,
    amount: number,
    signers: Account[],
){
    const account = new Account();
    instructions.push(
        SystemProgram.createAccount({
            fromPubkey: payer,
            newAccountPubkey: account.publicKey,
            lamports: amount,
            space: MiningLayout.span,
            programId: LENDING_PROGRAM_ID,
        }),
    );
    signers.push(account);
    return account.publicKey;
}
// TODO: check if one of to accounts needs to be native sol ... if yes unwrap it ...
export async function findOrCreateAccountByMint(
    payer: PublicKey,
    owner: PublicKey,
    instructions: TransactionInstruction[],
    cleanupInstructions: TransactionInstruction[],
    mint: PublicKey, // use to identify same type
    signers: Signer[],
    account?:TokenAccount
): Promise<PublicKey> {
    let toAccount: PublicKey;
    if (account && !account.info.isNative){
        toAccount = account.pubkey;
    } else {
        const connection = await getConnection()
        // creating depositor pool account
        toAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            instructions,
            payer,
            mint,
            owner,
        );
        if (mint.equals(WRAPPED_SOL_MINT)) {
            cleanupInstructions.push(
                Token.createCloseAccountInstruction(
                    TOKEN_PROGRAM_ID,
                    toAccount,
                    payer,
                    payer,
                    []
                )
            );
        }
    }

    return toAccount;
}
