import {PublicKey, SYSVAR_CLOCK_PUBKEY, SYSVAR_RENT_PUBKEY, TransactionInstruction} from "@solana/web3.js";
import BN from "bn.js";
import {Detail, LendingInstruction, Reserve} from "@/api/models";
import BufferLayout from "buffer-layout";
import {LENDING_PROGRAM_ID, TOKEN_PROGRAM_ID} from "@/api/constants/config";
import * as Layout from './../../utils/layout';

export const createDepositMiningInstruction = (
    mining:PublicKey,
    depositAmount:BN,
    sourceAccount:PublicKey,
    reserve:Detail<Reserve>,
    lendingMarket:PublicKey,
    lendingMarketAuthority: PublicKey,
    miningOwner:PublicKey,
    transferAuthority: PublicKey,
) => {
    const dataLayout = BufferLayout.struct([
        BufferLayout.u8('instruction'),
        Layout.uint64("depositAmount")
    ]);
    const data = Buffer.alloc(dataLayout.span);
    dataLayout.encode({
        instruction: LendingInstruction.DepositMining,
        depositAmount: depositAmount
    }, data);
    const keys = [
            { pubkey: sourceAccount, isSigner: false, isWritable: true },
            { pubkey: reserve.info.bonus.unCollSupply, isSigner: false, isWritable: true },
            { pubkey: mining, isSigner: false, isWritable: true },

            { pubkey: reserve.pubkey, isSigner: false, isWritable: false },
            { pubkey: lendingMarket, isSigner: false, isWritable: false },
            // { pubkey: lendingMarketAuthority, isSigner: false, isWritable: false },

            { pubkey: miningOwner, isSigner: true, isWritable: false },
            { pubkey: transferAuthority, isSigner: true, isWritable: false },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ];

    return new TransactionInstruction({
        keys,
        programId: LENDING_PROGRAM_ID,
        data,
    });
}
