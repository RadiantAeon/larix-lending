// @ts-ignore
import SolanaWalletAdapter from '@project-serum/sol-wallet-adapter'
import store from '@/store'
import {
    WalletAdapter,
    SolongWalletAdapter,
    MathWalletAdapter,
    PhantomWalletAdapter,
    LedgerWalletAdapter,
    Coin98WalletAdapter,
    SlopeWalletAdapter
} from '@/api/wallets'
import {web3Config} from "@/utils/web3";
import appController from "@/controller/appController";
import {BitKeepWalletAdapter} from "@/api/wallets/bitkeep";
import {TokenPocketWalletAdapter} from "@/api/wallets/tokenpocket";
import { CoinhubWalletAdapter } from '../wallets/coinhub';
import {PublicKey} from "@solana/web3.js";
import { CloverWalletAdapter } from '../wallets/clover';
import {HuobiWalletAdapter} from "@/api/wallets/huobi";
enum wallets {
    Ledger = '',
    'Sollet Extension' = '',
    Solong = '',
    // TrustWallet = '',
    MathWallet = '',
    Phantom = '',
    Coin98 = '',
    Slope = '',
    TokenPocket = '',
    BitKeep = '',
    Solflare = 'https://solflare.com/access-wallet',
    Sollet = 'https://www.sollet.io',
    Coinhub='',
    Huobi ='',
    // Solflare = 'https://solflare.com/access-wallet',
    Bonfida = 'https://bonfida.com/wallet'

}

let wallet:WalletAdapter | null

export function getWallet(): WalletAdapter | null{
    if (wallet) {return wallet}
    return null
}

export async function connect(walletName: string) {
    let connectingWallet: WalletAdapter | any
    const { rpcs } = web3Config
    const endpoint = rpcs[0]

    switch (walletName) {
        case 'Ledger': {
            connectingWallet = new LedgerWalletAdapter()
            break
        }
        case 'Sollet Extension': {
            if ((window as any).sollet === undefined) {
                return {
                    message:'Connect wallet failed . Please install and initialize Sollet wallet extension first',
                    installUrl:'https://chrome.google.com/webstore/detail/sollet/fhmfendgdocmcbmfikdcogofphimnkno'
                }
            }
            connectingWallet = new SolanaWalletAdapter((window as any).sollet, endpoint)
            break
        }
        case 'Solong': {
            if ((window as any).solong === undefined) {
                return {
                    message:'Connect wallet failed . Please install and initialize Solong wallet extension first',
                    installUrl:'https://chrome.google.com/webstore/detail/solong/memijejgibaodndkimcclfapfladdchj'
                }
            }

            connectingWallet = new SolongWalletAdapter()
            break
        }
        case 'MathWallet': {
            // @ts-ignore
            if ((window as any).solana === undefined || !(window as any).solana.isMathWallet) {
                return {
                    message:'Connect wallet failed . Please install and initialize MathWallet extension first',
                    installUrl:'https://chrome.google.com/webstore/detail/math-wallet/afbcbjpbpfadlkmhmclhkeeodmamcflc'
                }
            }

            connectingWallet = new MathWalletAdapter()
            break
        }
        case 'Slope' : {
            if ((window as any).Slope===undefined) {
                return {
                    message:'Connect wallet failed . Please install and initialize Slope wallet extension first',
                    installUrl:'https://chrome.google.com/webstore/search/slope%20wallet?utm_source=chrome-ntp-icon'
                }

            }

            connectingWallet = new SlopeWalletAdapter()
            break
        }
        case 'Coin98': {
            if ((window as any).coin98===undefined) {
                return {
                    message:'Connect wallet failed . Please install and initialize Coin98 wallet extension first',
                    installUrl:'https://chrome.google.com/webstore/detail/coin98-wallet/aeachknmefphepccionboohckonoeemg'
                }
            }

            connectingWallet = new Coin98WalletAdapter()
            break
        }
        case 'BitKeep': {
            if ((window as any).bitkeep===undefined) {
                return {
                    message:'Connect wallet failed . Please install and initialize Bitkeep wallet extension first',
                    installUrl:'https://bitkeep.org/download.html'
                }
            }
            connectingWallet = new BitKeepWalletAdapter()
            break
        }
        case 'TokenPocket': {
            // @ts-ignore
            if ((window as any).solana === undefined || !(window as any).solana.isTokenPocket) {
                return {
                    message:'You must connect through the tokenPocket wallet App',
                    installUrl:'https://www.tokenpocket.pro/zh/download/app'
                }
            }
            connectingWallet = new TokenPocketWalletAdapter()
            break
        }
        case 'Coinhub' : {
            if ((window as any).coinhub===undefined) {
                return {
                    message:'Connect wallet failed . Please install and initialize Coinhub wallet extension first',
                    installUrl:'https://www.coinhub.org/'
                }
            }
            connectingWallet = new CoinhubWalletAdapter()
            break
        }
        case 'Clover' : {
            if ((window as any).clover===undefined) {
                return {
                    message:'Connect wallet failed . Please install and initialize Coinhub wallet extension first',
                    installUrl:'https://chrome.google.com/webstore/detail/clover-wallet/nhnkbkgjikgcigadomkphalanndcapjk?utm_source=chrome-ntp-icon'
                }
            }
            connectingWallet = new CloverWalletAdapter()
            break
        }
        case 'Phantom': {
            if ((window as any).solana === undefined || !(window as any).solana.isPhantom) {
                return {
                    message:'Connect wallet failed . Please install and initialize Phantom wallet extension first',
                    installUrl:'https://chrome.google.com/webstore/detail/phantom/bfnaelmomeimhlpmgjnjophhpkkoljpa'
                }
            }

            connectingWallet = new PhantomWalletAdapter()
            break
        }
        case 'Solflare': {
            // @ts-ignore
            connectingWallet = new SolanaWalletAdapter(wallets.Solflare, endpoint)
            break
        }
        case 'Sollet Web': {
            // @ts-ignore
            connectingWallet = new SolanaWalletAdapter(wallets.Sollet, endpoint)
            break
        }
        case 'HuobiWallet': {
            if ( (window as any).huobiWallet?.isHuobiWallet===undefined) {
                return {
                    message:'Connect wallet failed . Please use Huobi wallet App',
                    installUrl:'https://www.huobiwallet.com/'
                }
            }
            // @ts-ignore
            connectingWallet = new HuobiWalletAdapter()
            break
        }
        default: {
            // @ts-ignore
            connectingWallet = new SolanaWalletAdapter(wallets[walletName], endpoint)
            break
        }
    }

    connectingWallet.on('connect', () => {

        // this.$accessor.wallet.closeModal().then(() => {
        //   if (wallet.publicKey) {
        //     this.wallet = wallet
        //     this.$accessor.wallet.setConnected(wallet.publicKey.toBase58())
        //
        //     // this.subWallet()
        //     console.log({
        //       message: 'Wallet connected',
        //       description: ''
        //     })
        //   }
        // })

        if (connectingWallet.publicKey) {
            wallet = connectingWallet
            // @ts-ignore
            // wallet = {publicKey:new PublicKey("8L8bWQQbtzB8FCgteebPT2wt66a5F9vpNTFf73dtPuyi")}
            // @ts-ignore
            store.commit('updateWalletAddress',wallet.publicKey.toBase58())
            appController.updateData(0)
            setInterval(()=>{
                appController.updateData(store.state.market.userObligationIndex)
            },16000)
        }
    })

    connectingWallet.on('disconnect', () => {
        disconnect()
    })

    try {
        connectingWallet.connect()
        localStorage.setItem('walletName', walletName)

    } catch (error) {
        console.error({
            message: 'Connect wallet failed',
            description: error.message
        })
    }
}

export function disconnect() {
    if (wallet) wallet.disconnect
    wallet = null
    store.commit('updateWalletAddress', '')
    store.commit('updateIsLoadingInfo',true)
    store.commit('updateIsLoadingUserLarixStakeInfo',true)
    console.warn({
        message: 'Wallet disconnected',
        description: ''
    })
}