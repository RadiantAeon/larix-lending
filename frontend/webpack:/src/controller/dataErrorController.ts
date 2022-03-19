import {URL} from "@/api/constants/config";
import {updateConnection} from "@/api/context/connection";
const superNodeAddress = "https://"+document.domain+"/solana-mainnet"
let useSuperNode = false
const setUseSuperNode = function (val:boolean) {
    useSuperNode = val
}
export default {
    superNodeAddress,
    controlDataError: function (sec:number) {
        if (useSuperNode) return
        setUseSuperNode(true)
        updateConnection(superNodeAddress)
        setTimeout(()=>{
            updateConnection(URL)
            setUseSuperNode(false)

        },sec*1000)
    }
}