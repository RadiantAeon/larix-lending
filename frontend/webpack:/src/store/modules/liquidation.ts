export const moduleLiquidation = {
    state: () => ({
        allUserObligations: {},
        selectUserObligations:{},
        firstOpen:true
    }),
    getters: {
    },
    mutations: {
        updateAllUserObligations(state:any,value:any){
            state.allUserObligations = value
        },
        updateSelectUserObligations(state:any,value:any){
            state.selectUserObligations = value
        },
        updateFirstOpen(state:any,value:boolean){
            state.firstOpen = value
        },

    },
    actions: {
    }
}