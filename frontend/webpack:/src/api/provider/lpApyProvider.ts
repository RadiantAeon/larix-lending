import { lpApy } from "../models/state/lpApy";
import BigNumber from "bignumber.js";
BigNumber.config({EXPONENTIAL_AT: 1e9});
import {eX} from "@/utils/helpers";

export class LpApyProvider {
    private perBlock  = new BigNumber(0);
    private perBlockB = new BigNumber(0);
    constructor() {
    }
    getLpApyDetails(tvl:BigNumber, rewardAPrice:BigNumber, rewardBPrice:BigNumber, rewardADecimals:number, rewardBDecimals:number){
        const rewardAOneYear = eX(this.perBlock.times(rewardAPrice).times(2*60*60*24*365).toString(),-rewardADecimals)
        const rewardBOneYear = eX(this.perBlockB.times(rewardBPrice).times(2*60*60*24*365).toString(),-rewardBDecimals)
        const aprA = rewardAOneYear.div(tvl.isEqualTo(0)?1:tvl).times(100)
        const aprB = rewardBOneYear.div(tvl.isEqualTo(0)?1:tvl).times(100)
        const apyA = (1+Number(aprA.toFixed(4))/365/100)**365-1
        const apyB = (1+Number(aprB.toFixed(4))/365/100)**365-1
        const totalApr = aprA.plus(aprB)
        const totalApy =  apyA + apyB
        return{
            apyA:apyA,
            apyB:apyB,
            totalApr:totalApr,
            totalApy:totalApy
        }
    }
    setPool(perBlock:BigNumber,perBlockB:BigNumber){
        this.perBlock = perBlock;
        this.perBlockB = perBlockB;
    }


}
export class LpFeeApyProvider extends LpApyProvider{
    private raydiumPairs :lpApy[]
    private stakePoolInfo:any
    constructor(raydiumPairs:lpApy[],stakePoolInfo:any|null) {
        super()
        this.raydiumPairs = raydiumPairs
        if (stakePoolInfo){
            this.stakePoolInfo = stakePoolInfo
        }
    }
    getPoolFeeApy(amm_id:string){
        return this.raydiumPairs.find((item:any) => item.amm_id === amm_id)?.apy
    }
    getTvl(amm_id:string){
        if (this.stakePoolInfo){
            const totalFarmLp = eX(this.stakePoolInfo.farmLpInfo.info.amount.toString(),-6)
            const lpPrice = this.raydiumPairs.find((item:any) => item.amm_id === amm_id)?.lp_price
            return {
                totalFarmLp:totalFarmLp.times(lpPrice||0),
                lpPrice:lpPrice
            }
        }

    }
}
