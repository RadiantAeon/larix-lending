export const moduleTxDialog = {
    state: () => ({
        confirmDialog: false,
        confirmDialogTip: '',
        confirmDialogShowScan: false,
        currentTxHash: '',
        checkModel: false,//打勾
        errorModel: false,//打叉
        errorContext:'',
    }),
    getters: {
    },
    mutations: {
        updateConfirmDialog(state: any,value: boolean){
            state.confirmDialog = value
        },
        updateConfirmDialogTip(state: any,value: string){
            state.confirmDialogTip = value
        },
        updateConfirmDialogShowScan(state: any,value: boolean){
            state.confirmDialogShowScan = value
        },
        updateCurrentTxHash(state: any,value: string){
            state.currentTxHash = value
        },
        updateCheckModel(state: any, value: boolean) {
            state.checkModel = value
        },
        updateErrorModel(state: any, value: boolean) {
            state.errorModel = value
        },
        updateErrorContext(state: any, value: string) {
            state.errorContext = value
        },

    },
    actions: {
    }
}