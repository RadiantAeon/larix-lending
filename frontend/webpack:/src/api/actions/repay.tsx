import {
    Account,
    TransactionInstruction,
} from '@solana/web3.js';
import {
    Detail,
    Obligation,
    repayObligationLiquidityInstruction,
    Reserve,
    TokenAccount,
} from '../models';
import {ensureSplAccount} from "./utils/account"
import {getConnection, sendTransaction} from "../context/connection";
import {WalletAdapter} from "@/api/wallets";
import BN from "bn.js";
import {U64_MAX} from "@/api/constants/math";
import {getObligation} from "@/api/provider/obligationProvider";
import {refreshReserves} from "@/api/actions/utils/refreshReserves";

// @FIXME
export const repay = async (
    obligation: Detail<Obligation>,
    repayReserveDetail: Detail<Reserve>,
    source: TokenAccount,
    liquidityAmount: number | BN,
    wallet: WalletAdapter,
    allReserve: Array<Detail<Reserve>>,
) => {

    if (wallet.publicKey == null) {
        throw new Error("wallet need connection")
    }
    if (obligation === undefined) {
        const myObligations = await getObligation(repayReserveDetail.info.lendingMarket, 'userAction')
        if (myObligations.length > 0) {
            obligation = myObligations[0]
        }
    }
    // user from account
    const connection = await getConnection()
    const signers: Account[] = [];
    const instructions: TransactionInstruction[] = [];
    const cleanupInstructions: TransactionInstruction[] = [];

    if (liquidityAmount === -1) {
        liquidityAmount = U64_MAX
    }
    const sourceLiquidity = ensureSplAccount(
        instructions,
        cleanupInstructions,
        source,
        wallet.publicKey,
        source.info.amount.toNumber() - 10000,
        signers
    );
    await refreshReserves(instructions, [repayReserveDetail])
    instructions.push(
        repayObligationLiquidityInstruction(
            liquidityAmount,
            sourceLiquidity,
            repayReserveDetail.info.liquidity.supplyPubkey,
            repayReserveDetail.pubkey,
            obligation.pubkey,
            repayReserveDetail.info.lendingMarket,
            // lendingMarketAuthority,
            wallet.publicKey,
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
