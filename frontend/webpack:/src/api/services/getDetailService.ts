import BigNumber from "bignumber.js";
import {USE_BACKUP_PRICE} from "@/api/constants/config";
const BACKUP_PRICE = 0.08
const DOUBLE_REWARD_BACKUP_PRICE = {"lido-dao":{usd:1.46},"marinade":{"usd":0.188}}
const RAYDIUM_POOLS_BACKUP = [
    {
        name: 'mSOL-USDT',
        apy:4.03,
    },
    {
        name: 'mSOL-USDC',
        apy:3.57,
    },
    {
        name: 'SOL-USDC',
        apy:12.17,
    },
    {
        name: 'RAY-SOL',
        apy:3.25,
    }
]
const getLarixPrice = async () => {
    if (USE_BACKUP_PRICE){
        const response = await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=larix&vs_currencies=usd"
        );
        const result = new BigNumber((await response.json())["larix"].usd)
        return new BigNumber(result)
    }
    try {
        const response = await fetch(
            "/getLarixPrice"
        );
        const data = await response.text()
        return new BigNumber(data)

    } catch (e) {
        console.log(e)
        try {
            const response = await fetch(
                "/getLarixPriceByMxc"
            );
            const data = (await response.json()).data[0];
            return new BigNumber(data.last!=='0'?data.last:data.ask);

        } catch (e) {
            console.log(e)
            try {
                const response = await fetch(
                    "/getLarixPriceByGate"
                );
                const data = await response.json();
                return new BigNumber(data.last!=='0'?data.last:data.lowestAsk);

            } catch (e) {
                console.log(e)
                return new BigNumber(BACKUP_PRICE)
            }
        }
    }
};
let doubleRewardTokenPriceCache : {}
let lastUpdateTimes : number
const getDoubleRewardPrice = async () => {
    if (USE_BACKUP_PRICE){
        const response = await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=marinade,lido-dao&vs_currencies=usd"
        );

        const result = (await response.json())
        return result
    }else {

        const nowUpdateTimes = new Date().valueOf()
        if (!lastUpdateTimes){
            lastUpdateTimes = new Date().valueOf()
        }
        if (nowUpdateTimes-lastUpdateTimes<1200000&&doubleRewardTokenPriceCache){
            return doubleRewardTokenPriceCache
        }

        try {
            const response = await fetch(
                "/getMndePrice"
            );
            const result = await response.json()
            doubleRewardTokenPriceCache = result
            lastUpdateTimes = nowUpdateTimes
            return result
        } catch (e){
            if (doubleRewardTokenPriceCache)
            {
                return doubleRewardTokenPriceCache
            }else {
                // @ts-ignore
                return DOUBLE_REWARD_BACKUP_PRICE
            }

        }
    }

}
let raydiumPoolsCache : { }
let lastRaydiumPoolsUpdateTimes : number
const getRaydiumPools = async ()=> {
    const nowUpdateTimes = new Date().valueOf()
    if (!lastRaydiumPoolsUpdateTimes) {
        lastRaydiumPoolsUpdateTimes = new Date().valueOf()
    }
    if (nowUpdateTimes - lastRaydiumPoolsUpdateTimes < 60000 && raydiumPoolsCache) {
        return raydiumPoolsCache
    }
    try {
        const response = await fetch(
            "https://api.raydium.io/pairs"
        );
        const result = await response.json()
        raydiumPoolsCache = result
        lastRaydiumPoolsUpdateTimes = nowUpdateTimes
        return result
    } catch (e) {
        if (raydiumPoolsCache) {
            return raydiumPoolsCache
        }else {
            return RAYDIUM_POOLS_BACKUP
        }
    }
}
export default {
    getLarixPrice,
    getDoubleRewardPrice,
    getRaydiumPools
}