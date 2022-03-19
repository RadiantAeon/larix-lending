import {Detail} from "@/api/models";
import {WithdrawLpAccount} from "@/api/models/state/withdrawLpAccount";
import {getBridgeProgram} from "@/api/context/bridgePool";
import { PublicKey} from "@solana/web3.js";

export async function withdrawLpAccountProviderByOwner(ownerAddress:PublicKey):Promise<Detail<WithdrawLpAccount>[]>{
    const bridgeProgram = await getBridgeProgram()
    const accounts = await bridgeProgram.account.withdrawLpAccount.all([
        {
            dataSize: bridgeProgram.account.withdrawLpAccount.size
        },
        {
            memcmp: {
                offset: 8,
                bytes: ownerAddress.toBase58()
            }
        }
    ]);
    const result:Detail<WithdrawLpAccount>[] = [];
    accounts.map((account:any) =>{
        result.push( {
            pubkey:account.publicKey,
            account: null,
            info: account.account as WithdrawLpAccount,
        } as Detail<WithdrawLpAccount>)
    })
    return result
}


export async function withdrawLpAccountProvider(ownerAddress:PublicKey, bridgePoolAddress:PublicKey):Promise<Detail<WithdrawLpAccount>[]>{
    const bridgeProgram = await getBridgeProgram(), accounts = await bridgeProgram.account.withdrawLpAccount.all([
        {
            dataSize: bridgeProgram.account.withdrawLpAccount.size
        },
        {
            memcmp: {
                offset: 8,
                bytes: ownerAddress.toBase58()
            }
        }
    ]);
    const result:Detail<WithdrawLpAccount>[] = [];
    accounts.map((account:any) =>{
        if (bridgePoolAddress.equals(account.account.poolId)){
            result.push( {
                pubkey:account.publicKey,
                account: null,
                info: account.account as WithdrawLpAccount,
            } as Detail<WithdrawLpAccount>)
        }
    })
    return result
}