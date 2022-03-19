import {Detail} from "@/api/models";
import {WithdrawLpAccount} from "@/api/models/state/withdrawLpAccount";
import {getLarixLockProgram} from "@/api/context/larixLock";
import { PublicKey} from "@solana/web3.js";
import {UserLarixInfo} from "@/api/models/state/userLarixInfo";
import {Position} from "@/api/models/state/position";

export async function getPositionsByOwner(ownerAddress:PublicKey):Promise<Detail<Position>[]>{
    const larixLockProgram = await getLarixLockProgram()
    const accounts = await larixLockProgram.account.position.all([
        {
            dataSize: larixLockProgram.account.position.size
        },
        {
            memcmp: {
                offset: 8,
                bytes: ownerAddress.toBase58()
            }
        }
    ]);
    const result:Detail<Position>[] = [];
    accounts.map(account =>{
        result.push( {
            pubkey:account.publicKey,
            account: null,
            info: account.account as Position,
        } as Detail<Position>)
    })
    return result
}
