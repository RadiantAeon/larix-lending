import { createStore , createLogger} from 'vuex'
import { moduleTheme } from '@/store/modules/theme'
import {moduleWallet} from "@/store/modules/wallet";
import {moduleMarket} from "@/store/modules/market";
import {moduleDialog} from "@/store/modules/dialog";
import {moduleLarix} from "@/store/modules/larix";
import {moduleReward} from "@/store/modules/reward";
import {moduleLiquidation} from "@/store/modules/liquidation"


import { store as app, AppStore, AppState } from '@/store/modules/app'
import {moduleTxDialog} from "@/store/modules/txDialog";

export default createStore({
    state: {
        appTab: 'Home',
        clientViewPort:0,
    },
    getters: {
    },
    mutations: {
        updateAppTab(state:any,value:string){
            state.appTab = value
        },
        updateClientViewPort(state:any,value:number){
            state.clientViewPort = value
        },
    },
    actions: {
    },
    modules: {
        theme: moduleTheme,
        wallet: moduleWallet,
        market: moduleMarket,
        dialog: moduleDialog,
        larix: moduleLarix,
        reward: moduleReward,
        txDialog: moduleTxDialog,
        liquidation:moduleLiquidation,
    }
})

export interface RootState {
    app: AppState
}
export type Store = AppStore<Pick<RootState, 'app'>>

// Plug in logger when in development environment
const debug = process.env.NODE_ENV !== 'production'
const plugins = debug ? [createLogger({})] : []
export const store = createStore({
  plugins,
  modules: {
    app
  }
})

export function useStore (): Store {
  return store as Store
}
