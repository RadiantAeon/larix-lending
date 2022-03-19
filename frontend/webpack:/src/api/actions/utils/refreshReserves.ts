import {Detail, Reserve,refreshReservesInstruction} from "../../models";
import {Account, Connection, TransactionInstruction} from "@solana/web3.js";
import {getBridgePool, getBridgeProgram} from "../../context/bridgePool";
const MAX_RESERVE_LENGTH = 3
export const refreshReserves = async (
    instructions: TransactionInstruction[],
    reserves:Array<Detail<Reserve>>
)=>{
    if (reserves.length===0){
        return
    }
    if (reserves.length>MAX_RESERVE_LENGTH){
        const startReserves = reserves.slice(0,MAX_RESERVE_LENGTH)
        await refreshBridgePool(instructions,startReserves)
        instructions.push(refreshReservesInstruction(
            startReserves
        ))
        const endReserves = reserves.slice(MAX_RESERVE_LENGTH,reserves.length)
       await refreshReserves(instructions,endReserves)
    } else {
        await refreshBridgePool(instructions,reserves)
        instructions.push(refreshReservesInstruction(
            reserves
        ))
    }
}

export async function refreshBridgePool(instructions:TransactionInstruction[],reserves:Array<Detail<Reserve>>){
    const bridgePoolProgram = await getBridgeProgram()
    for (const reserve of reserves){
        if (reserve.info.isLP){
            const bridgePoolID = reserve.info.liquidity.params_1
            const bridgePool = await getBridgePool(bridgePoolID)
            instructions.push(bridgePoolProgram.instruction.refresh(
                {
                    accounts:{
                        pool: bridgePoolID,
                        lpPrice: bridgePool.lpPriceAccount,
                        ammId: bridgePool.ammId,
                        lpMint: bridgePool.lpMint,
                        lpSupply: bridgePool.lpSupply,
                        coinMintPrice: bridgePool.coinMintPrice,
                        pcMintPrice:bridgePool.pcMintPrice,
                        ammOpenOrders:bridgePool.ammOpenOrders,
                        coinMintSupply:bridgePool.ammCoinMintSupply,
                        pcMintSupply:bridgePool.ammPcMintSupply,
                        farmLedger:bridgePool.farmLedger,

                    }
                }
            ))
        }
    }
}