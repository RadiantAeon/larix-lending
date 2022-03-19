import {Program} from "@project-serum/anchor";
import {
    LARIX_LOCK_IDL,
    LARIX_LOCK_POOL_ID,
    LARIX_LOCK_PROGRAM_ID
} from "@/api/constants/config";
import {getProvider} from "@/api/context/connection";
import {LarixLockPool} from "@/api/models/state/larixLockPool";

let program:Program
export async function getLarixLockProgram():Promise<Program>{
    if (program){
        return program
    } else {
        return program = new Program(LARIX_LOCK_IDL,LARIX_LOCK_PROGRAM_ID,await getProvider());
    }
}
let larixPool:LarixLockPool
export async function getLarixLockPool(load=false):Promise<LarixLockPool>{
    if (!load && larixPool){
        return larixPool
    } else {
        const larixLockProgram = await getLarixLockProgram()
        return larixPool = (await larixLockProgram.account.lockPool.fetch(LARIX_LOCK_POOL_ID)) as LarixLockPool
    }
}