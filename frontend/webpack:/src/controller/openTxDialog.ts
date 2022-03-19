import store from '../store'
export default function openTxDialog( dialogSwitchMutation?: string){
    if (dialogSwitchMutation) store.commit(dialogSwitchMutation, false)
    // TODO: ShowScan 控制
    // store.commit('updateConfirmDialogShowScan', false)
    store.commit('updateConfirmDialog', true)
    store.commit('updateErrorModel', false)
    store.commit('updateCheckModel', false)
    store.commit('updateConfirmDialogTip', 'pendingDialog.confirm')
    store.commit('updateErrorContext','')
}