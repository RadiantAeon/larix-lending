import BigNumber from "bignumber.js";

export const moduleMarket = {
    state: () => ({
        lendingMarket: null,
        mining:null,
        allMining:null,
        userObligation: null,
        userObligationIndex: 0,
        userAllObligation:null,
        lendingReserveArray: null,
        allReservesDetails: [],
        selectedReserveDetail: {},
        isLoadingInfo: true,
        marketIdType: 'Supply',
        allMarketTotalSupply: new BigNumber(0),
        allMarketTotalBorrow: new BigNumber(0),
        userTotalSupply:  new BigNumber(0),
        userTotalBorrow:  new BigNumber(0),
        userBorrowLimit:  new BigNumber(0),
        userLiquidationThreshold:new BigNumber(0),
        userLarixReward:  new BigNumber(0),
        netRate:new BigNumber(0),
        larixPrice:0,
        larixCirculation:0,
        totalDailyMining:new BigNumber(0),
        needToWithdrawLpArray : [],
        needToHandleCtokenAccounts :[],
        lpFeesAprDetails :[],
        mineCollateralLpDetails : {},
        userLarixPositions:{},
        isLoadingUserLarixStakeInfo:true,
        userRawPositionData:{},
        needToHanldeUserFeeLarixInfo:[],
        autoFreshTime:0
    }),
    getters: {
        userBorrowLimitUsedPercent: function (state: any):number {
            return state.userTotalBorrow
                .div(state.userBorrowLimit.isGreaterThan(0)?state.userBorrowLimit:1)
                .times(100)
                ?.toFixed(2)
        },
        allReservesMap: function (state: any):Object {
            return Object.fromEntries((state.allReservesDetails)
                .map((details:any) => {
                    return [details.liquidityMintPubkey, details]
                }))
        },
    },
    mutations: {
        updateLendingMarket(state:any,value:any){
            state.lendingMarket = value
        },
        updateMining(state:any,value:any){
            state.mining = value
        },
        updateAllMining(state:any,value:any){
            state.allMining = value
        },
        updateUserObligation(state:any,value:any){
            state.userObligation = value
        },
        updateUserAllObligation(state:any,value:any){
            state.userAllObligation = value
        },
        updateLendingReserveArray(state:any,value:any){
            state.lendingReserveArray = value
        },
        updateAllReservesDetails(state: any, value: string) {
            state.allReservesDetails = value
        },
        updateSelectedReserveDetail(state: any, value: string) {
            state.selectedReserveDetail = value
        },
        updateIsLoadingInfo(state:any,value:string){
            state.isLoadingInfo = value
        },
        updateAllMarketTotalBorrow(state:any,value:BigNumber){
            state.allMarketTotalBorrow = value
        },
        updateAllMarketTotalSupply(state:any,value:BigNumber){
          state.allMarketTotalSupply = value
        },
        updateUserTotalSupply(state:any,value:BigNumber){
          state.userTotalSupply = value
        },
        updateUserLarixReward(state:any,value:BigNumber){
            state.userLarixReward = value
        },
        updateUserTotalBorrow(state:any,value:BigNumber){
          state.userTotalBorrow = value
        },
        updateUserBorrowLimit(state:any,value:BigNumber){
          state.userBorrowLimit = value
        },
        updateUserLiquidationThreshold(state:any,value:BigNumber){
            state.userLiquidationThreshold = value
        },
        updateMarketId(state:any,value:string){
            state.marketIdType = value
          },
        updateNetRate(state:any,value:BigNumber){
            state.netRate = value
        },
        updateLarixPrice(state:any,value:number){
            state.larixPrice = value
        },
        updateLarixCirculation(state:any,value:string){
            state.larixCirculation = value
        },
        updateTotalDailyMining(state:any,value:BigNumber){
            state.totalDailyMining = value
        },
        updateUserObligationIndex(state:any,value:number){
            state.userObligationIndex = value
        },
        updateNeedToHandleCtokenAccounts(state:any,value:any){
            state.needToHandleCtokenAccounts = value
        },
        updateNeedToWithdrawLpArray(state:any,value:any){
            state.needToWithdrawLpArray = value
        },
        updateLpFeesAprDetails(state:any,value:any){
            state.lpFeesAprDetails = value
        },
        updateMineCollateralLpDetails(state:any,value:any){
            state.mineCollateralLpDetails = value
        },
        updateUserLarixPositions(state:any,value:any){
            state.userLarixPositions = value
        },
        updateIsLoadingUserLarixStakeInfo(state:any,value:any){
            state.isLoadingUserLarixStakeInfo = value
        },
        updateUserRawPositionData(state:any,value:any){
            state.userRawPositionData = value
        },
        updateNeedToHanldeUserFeeLarixInfo(state:any,value:any){
            state.needToHanldeUserFeeLarixInfo = value
        },
        updateAutoFreshTime(state:any,value:number){
            state.autoFreshTime = value
        }
    },
    actions: {
    }
}