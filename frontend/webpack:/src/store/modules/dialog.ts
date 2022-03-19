export const moduleDialog = {
    state: () => ({
        supplyDialogVisible: false,
        borrowDialogVisible: false,
        transactionDialogVisible: false,
        liquidateDialogVisible: false,
        noticeDialogVisible: false,
        nftNoticeVisible:false,
        isFullWithdraw:false,
        isFullRepay:false,
        openObligationDialogVisible:false,
        HandleLpDialogVisible:false,
        borrowFeeTipDialogVisible:false,
        larixStakingDialogVisible:false
    }),
    getters: {
    },
    mutations: {
        updateIsFullRepay(state:any,value:boolean){
            state.isFullRepay = value
        },
        updateIsFullWithdraw(state:any,value:boolean){
            state.isFullWithdraw = value
        },
        updateSupplyDialogVisible(state: any, value: string) {
            state.supplyDialogVisible = value
        },
        updateBorrowDialogVisible(state: any, value: string) {
            state.borrowDialogVisible = value
        },
        updateTransactionDialogVisible(state: any, value: string) {
            state.transactionDialogVisible = value
        },
        updateLiquidateDialogVisible(state: any, value: string) {
            state.liquidateDialogVisible = value
        },
        updateNoticeDialogVisible(state: any, value: boolean) {
            state.noticeDialogVisible = value
        },
        updateNFTNoticeVisible(state: any, value: boolean) {
            state.nftNoticeVisible = value
        },
        updateOpenObligationDialogVisible(state: any, value: boolean) {
            state.openObligationDialogVisible = value
        },
        updateHandleLpDialogVisible(state: any, value: boolean) {
            state.handleLpDialogVisible = value
        },
        updateBorrowFeeTipDialogVisible(state: any, value: boolean) {
            state.borrowFeeTipDialogVisible = value
        },
        updateLarixStakingDialogVisible(state: any, value: boolean) {
            state.larixStakingDialogVisible = value
        },

    },
    actions: {
    }
}
