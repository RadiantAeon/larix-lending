import { DOUBLE_REWARD_CONFIG } from "@/api/constants/config";
import BigNumber from "bignumber.js";


export class DoubleReward{
    private reserve:any;
    private rewardSymbol:string|undefined;
    private rewardDailyAmount = 0
    private rewardTokenPrice  = new BigNumber(0);
    private hasSingleTokenDoubleReward = false;
    private supplyDistribution = 0;
    private borrowDistribution = 0;
    constructor() {
    }
    public setDoubleRewardConfig(reserve:any,allPrice:any){
        this.reserve = reserve
        // @ts-ignore
        this.rewardSymbol = DOUBLE_REWARD_CONFIG[reserve.symbol]?.rewardSymbol||undefined
        if (this.rewardSymbol){
            // @ts-ignore
            this.rewardDailyAmount = DOUBLE_REWARD_CONFIG[reserve.symbol].rewardDailyAmount
            this.rewardTokenPrice = allPrice[this.rewardSymbol]
            // @ts-ignore
            this.supplyDistribution = DOUBLE_REWARD_CONFIG[reserve.symbol].supplyDistribution
            // @ts-ignore
            this.borrowDistribution = DOUBLE_REWARD_CONFIG[reserve.symbol].borrowDistribution
            if (!this.reserve.isLP){
                this.hasSingleTokenDoubleReward = true
            }
        }
    }
    public getDoubleRewardDetails(){

        if (this.rewardSymbol&&!this.reserve.isLP){
            this.reserve.singleTokenDoubleRewardApy = this.getDoubleRewardApy().supplyDoubleRewardAPR
            if (this.borrowDistribution>0){
                this.reserve.singleTokenDoubleBorrowRewardApy =  this.getDoubleRewardApy().borrowDoubleRewardAPR.times(100)
            }
            this.reserve.singleTokenDoubleRewardLogo = this.getLogoSource()
            this.reserve.hasSingleTokenDoubleReward = this.hasSingleTokenDoubleReward
            this.reserve.singleTokenDoubleRewardTokenSymbol = this.getRewardTokenSymbol()
            return this.reserve
        }else {
            this.reserve.singleTokenDoubleRewardApy = new BigNumber(0)
            return this.reserve
        }

    }
    public getLpDoubleRewardDetails(){
        if (this.rewardSymbol){
            this.reserve.lpInfo.doubleRewardApy = this.getDoubleRewardApy().supplyDoubleRewardAPR
            this.reserve.lpInfo.doubleRewardLogoSource = this.getLogoSource()
            this.reserve.lpInfo.doubleRewardSymbol = this.rewardSymbol
        }else {
            this.reserve.lpInfo.doubleRewardApy = new BigNumber(0)
            this.reserve.lpInfo.doubleRewardLogoSource = null
        }
    }
    private getDoubleRewardApy(){
        const rewardOneYear = new BigNumber(this.rewardTokenPrice).times((this.rewardDailyAmount||0)*365)
        const supplyDoubleRewardAPR = rewardOneYear.times(this.supplyDistribution).div(this.reserve.totalLiquidityInUsd.isZero()?1:this.reserve.totalLiquidityInUsd)
        const borrowDoubleRewardAPR = rewardOneYear.times(this.borrowDistribution).div(this.reserve.totalBorrowedInUsd.isZero()?1:this.reserve.totalBorrowedInUsd)
        return {
            supplyDoubleRewardAPR:supplyDoubleRewardAPR,
            borrowDoubleRewardAPR:borrowDoubleRewardAPR
        }
    }
    private getRewardTokenSymbol(){
        return this.rewardSymbol
    }
    private getLogoSource(){
        return require(`../assets/coin/asset_${this.rewardSymbol}.svg`)
    }
}
