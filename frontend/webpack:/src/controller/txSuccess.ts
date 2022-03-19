import store from '../store'

export default function txSuccess( dialogSwitchMutation?: string){
    store.commit('updateCheckModel', true)
    store.commit('updateConfirmDialogTip', 'pendingDialog.checkTips')
    setTimeout(() => {
        if (dialogSwitchMutation) store.commit(dialogSwitchMutation, false)
        store.commit('updateConfirmDialog', false)
        store.commit('updateCheckModel', false)
    }, 1200)
}