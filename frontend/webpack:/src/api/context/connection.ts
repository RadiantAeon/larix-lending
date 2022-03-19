import {
    Connection,
    Signer,
    Transaction,
    TransactionInstruction
} from "@solana/web3.js";
import {WalletAdapter} from "@/api/wallets/types";
import store from '../../store'
import {URL, WSSURL} from "@/api/constants/config";
import {Provider} from "@project-serum/anchor";



let connection:Connection
export function getConnection():Connection{
    if (connection) {return connection}
    connection = new Connection(URL, {
        commitment:'recent',
        // wsEndpoint: WSSURL
    });
    return connection;
}
export function updateConnection(url:string):void{
    connection = new Connection(url, {
        commitment:'recent',
        // wsEndpoint: WSSURL
    });
}
let provider:Provider
export async function getProvider():Promise<Provider>{
    if (provider){
        return provider
    } else {
        const wallet = (window as any).solana
        return provider = new Provider(
            await getConnection(), wallet, {
                commitment:'recent'
            },
        )
    }
}



export function useConnection():Connection{
    return connection
}




export function isReachTransactionLimit(
    connection: Connection,
    wallet: any,
    instructions: TransactionInstruction[],
    signers: Signer[]
){
    return getTransactionLength(connection,wallet,instructions,signers) > 1232
}
export function getTransactionLength(
    connection: Connection,
    wallet: any,
    instructions: TransactionInstruction[],
    signers: Signer[]
){
    const transaction = new Transaction();
    transaction.recentBlockhash = "8DCjq36FJve3BGPc5tu7emWCxG1deqPJzGdRBWTXeGqJ"
    transaction.feePayer = wallet.publicKey
    instructions.forEach((instruction) => transaction.add(instruction));
    return getTransactionLengthInner(transaction,signers)

}
function getTransactionLengthInner(transaction:Transaction,signers:Signer[]){
    return transaction.serializeMessage().length+signers.length*64+65
}
export const sendTransaction = async (
    connection: Connection,
    wallet: WalletAdapter,
    instructions: TransactionInstruction[],
    signers: Signer[],
    awaitConfirmation = true
) => {
    if (!wallet?.publicKey) {
        throw new Error("Wallet is not connected");
    }
    console.log(instructions)

    let transaction = new Transaction();
    transaction.feePayer = wallet.publicKey
    instructions.forEach((instruction) => transaction.add(instruction));

    transaction.recentBlockhash = (
        await connection.getRecentBlockhash("max")
    ).blockhash;
    // console.log(getTransactionLengthInner(transaction, signers));
    if (signers.length > 0) {
        transaction.partialSign(...signers);
    }
    try {
        transaction = await wallet.signTransaction(transaction);
    }catch (e) {
        console.log('wallet.signTransaction',e)
    }
    const rawTransaction = transaction.serialize();
    console.log(rawTransaction.length)
    const options = {
        skipPreflight: true,
        commitment: "processed",
    };
    const txid = await connection.sendRawTransaction(rawTransaction, options);
    if (awaitConfirmation) {


        const status = (
            await connection.confirmTransaction(
                txid,
                "confirmed"
            )
        ).value;
        console.log(txid)
        if (status.err) {
            //@ts-ignore
            if (status.err?.InstructionError[0]===0&&status.err?.InstructionError[1].Custom===1){
                //@ts-ignore
                store.commit('updateErrorContext',1001)
            }else {
                //@ts-ignore
                store.commit('updateErrorContext',status.err?.InstructionError[1].Custom)
            }
            console.log(status.err)
            throw new Error(status.err?.toString())
        }
    }

    return txid;
};
