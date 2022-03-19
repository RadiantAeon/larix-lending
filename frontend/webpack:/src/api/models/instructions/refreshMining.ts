import BufferLayout from "buffer-layout";
import {LendingInstruction} from "@/api/models";
import {PublicKey, SYSVAR_CLOCK_PUBKEY, TransactionInstruction} from "@solana/web3.js";
import {LENDING_PROGRAM_ID} from "@/api/constants/config";

export function refreshMiningInstruction(mining:PublicKey,reserves:PublicKey[]){
    const dataLayout = BufferLayout.struct([BufferLayout.u8('instruction')]);

    const data = Buffer.alloc(dataLayout.span);
    dataLayout.encode({ instruction: LendingInstruction.RefreshMining }, data);

    const keys = [
        { pubkey: mining, isSigner: false, isWritable: true },
    ];
    reserves.map(reserve => {
        keys.push({ pubkey: reserve, isSigner: false, isWritable: false })
    })
    return new TransactionInstruction({
        keys,
        programId: LENDING_PROGRAM_ID,
        data,
    });
}