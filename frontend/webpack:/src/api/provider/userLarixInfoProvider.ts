import {Detail} from "@/api/models";
import {WithdrawLpAccount} from "@/api/models/state/withdrawLpAccount";
import {getLarixLockProgram} from "@/api/context/larixLock";
import { PublicKey} from "@solana/web3.js";
import {UserLarixInfo} from "@/api/models/state/userLarixInfo";
import BigNumber from "bignumber.js";

export async function getUserLarixInfoByOwner(ownerAddress:PublicKey):Promise<Detail<UserLarixInfo>[]>{
    const larixLockProgram = await getLarixLockProgram()
    const accounts = await larixLockProgram.account.userLarixInfo.all([
        {
            dataSize: larixLockProgram.account.userLarixInfo.size
        },
        {
            memcmp: {
                offset: 8,
                bytes: ownerAddress.toBase58()
            }
        }
    ]);
    // console.log('accounts',accounts)
    const result:Detail<UserLarixInfo>[] = [];
    accounts.map(account =>{
        result.push( {
            pubkey:account.publicKey,
            account: null,
            info: account.account as UserLarixInfo,
        } as Detail<UserLarixInfo>)
    })
    // console.log('result',result)
    return result
}
export async function getUserFeeLarixInfoByOwner(ownerAddress:PublicKey):Promise<Detail<UserLarixInfo>[]>{
    const larixLockProgram = await getLarixLockProgram()
    const accounts = await larixLockProgram.account.userLarixInfo.all([
        {
            dataSize: larixLockProgram.account.userLarixInfo.size
        },
        {
            memcmp: {
                offset: 8,
                bytes: ownerAddress.toBase58()
            }
        }
    ]);
    // console.log('accounts',accounts)
    const result:Detail<UserLarixInfo>[] = [];
    accounts.map(account =>{
        if (new BigNumber(account.account.larixAmount).isGreaterThan(0))
        {
            result.push( {
                pubkey:account.publicKey,
                account: null,
                info: account.account as UserLarixInfo,
            } as Detail<UserLarixInfo>)
        }
    })
    // console.log('result',result)
    return result
}
