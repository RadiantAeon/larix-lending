import * as BufferLayout from 'buffer-layout';
import * as Layout from '../../utils/layout';
import {AccountInfo, PublicKey} from "@solana/web3.js";
import {Detail} from "@/api/models";
import {MintInfo} from "@solana/spl-token";
const MintLayout = BufferLayout.struct([
    BufferLayout.u32('mintAuthorityOption'),
    Layout.publicKey('mintAuthority'),
    Layout.uint64('supply'),
    BufferLayout.u8('decimals'),
    BufferLayout.u8('isInitialized'),
    BufferLayout.u32('freezeAuthorityOption'),
    Layout.publicKey('freezeAuthority')
]);
export const MintParser = (pubkey: PublicKey, info: AccountInfo<Buffer>|null):Detail<MintInfo> => {
    if (info==null){
        throw new Error("Info can not be null")
    }
    const buffer = Buffer.from(info.data);
    const mint = MintLayout.decode(buffer) as MintInfo
    const details = {
        pubkey,
        account: {
            ...info,
        },
        info: mint,
    } as Detail<MintInfo>;

    return details;
}