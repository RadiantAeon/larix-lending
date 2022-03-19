
// Action 类似于 mutation，不同在于：
// Action 提交的是 mutation，而不是直接变更状态。
// Action 可以包含任意异步操作。
import { ActionTree, ActionContext } from 'vuex'

// eslint-disable-next-line 
import { RootState } from '@/store'
import { AppState } from './state'
import { Mutations } from './mutations'
import { AppMutationTypes } from './mutation-types'
import { AppActionTypes } from './action-types'
type AugmentedActionContext = {
  commit<K extends keyof Mutations>(
    key: K,
    payload: Parameters<Mutations[K]>[1],
  ): ReturnType<Mutations[K]>
} & Omit<ActionContext<AppState, RootState>, 'commit'>

export interface Actions {
  [AppActionTypes.ACTION_SET_LANGUAGE](
    { commit }: AugmentedActionContext,
    language: string
  ): void
}

export const actions: ActionTree<AppState, RootState> & Actions = {
  [AppActionTypes.ACTION_SET_LANGUAGE] ({ commit }, language: string) {
    commit(AppMutationTypes.SET_LANGUAGE, language)
  }
}
