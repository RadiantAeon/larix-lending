import store from '../store'
export default function txFailed( dialogSwitchMutation?: string,e?:any) {
    if (e){
        if (e.toString().includes('Signature verification failed')){
            console.log('wallet Signature failed')
        }
        if (e.toString().includes('Transaction was not confirmed in')){
            store.commit('updateErrorContext',1002)
        }
        console.error(e)
    }
    store.commit('updateErrorModel', true)
    store.commit('updateConfirmDialogTip', 'pendingDialog.errorTips')
    if (store.state.wallet.walletAddress){
        setTimeout(() => {
            if (dialogSwitchMutation) store.commit(dialogSwitchMutation, true)
            store.commit('updateConfirmDialog', false)
            store.commit('updateErrorModel', false)
        }, 3000)
    }else {
        store.commit('updateErrorModel', false)
        store.commit('updateCheckModel', false)
    }
}