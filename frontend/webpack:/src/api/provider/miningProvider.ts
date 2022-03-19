import {getConnection} from "@/api/context/connection";
import {LENDING_ID, LENDING_PROGRAM_ID} from "@/api/constants/config";
import {Detail} from "../models"
import BufferLayout from "buffer-layout";

import {PublicKey} from "@solana/web3.js";
import {Mining, MiningLayout, MiningParser} from "@/api/models/state/mining";
export async function getMining(ownerAddress:PublicKey,actionType:string):Promise<Array<Detail<Mining>>>{
    const connection = await getConnection()
    const accountInfos = await connection.getProgramAccounts(LENDING_PROGRAM_ID,{
        filters:[
            {
                dataSize: MiningLayout.span
            },
            {
                memcmp: {
                    offset: BufferLayout.u8('version').span,
                    /** data to match, as base-58 encoded string and limited to less than 129 bytes */
                    bytes: ownerAddress.toBase58()
                }
            }

        ]
    })
    const resultArray = new Array<Detail<Mining>>();
    accountInfos.map(function (item):any{
        const value = MiningParser(item.pubkey,item.account)
        if (value.info.lendingMarket.equals(LENDING_ID)){
            resultArray.push(value)
        }
    })
    return resultArray
}
