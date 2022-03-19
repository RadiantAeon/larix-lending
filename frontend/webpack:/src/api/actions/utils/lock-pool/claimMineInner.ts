import {Account, Connection, PublicKey, TransactionInstruction} from "@solana/web3.js";
import {createClaimMineInstruction, Params} from "@/api/models/instructions/larix-lock-pool/claimMine";
import {Detail, Obligation, TokenAccount} from "@/api/models";
import {Mining} from "@/api/models/state/mining";
import BN from "bn.js";

export function claimMineInner(
    connection:Connection,
    signers: Account[],
    instructions: TransactionInstruction[],
    cleanupInstructions: TransactionInstruction[],
    lendingMarket:PublicKey,
    lendingMarketAuthority:PublicKey,
    mining:PublicKey,
    wallet:any,
    claimTimes:number,
    claimRatio:number,
    other:Params
    ){
    const instruction = createClaimMineInstruction(
        lendingMarket,
        lendingMarketAuthority,
        wallet.publicKey,
        mining,
        new BN(claimTimes),
        new BN(claimRatio),
        other
    )
    instructions.push(instruction)
}