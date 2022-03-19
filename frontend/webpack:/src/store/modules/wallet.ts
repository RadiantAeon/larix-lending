export const moduleWallet = {
    state: () => ({
        wallet: null,
        walletAddress: '',
        walletDialogVisible: false,
    }),
    getters: {
    },
    mutations: {
        updateWallet(state: any, value: Object) {
            state.wallet = value
        },
        updateWalletAddress(state: any, value: string) {
            state.walletAddress = value
        },
        updateWalletDialogVisible(state: any, value: boolean) {
            state.walletDialogVisible = value
        },

    },
    actions: {
    }
}