import {
    Detail,
    Obligation,
    ObligationCollateral,
    Reserve,
    TokenAccount
} from "@/api/models";
import {Account, PublicKey, SystemProgram, SYSVAR_CLOCK_PUBKEY, TransactionInstruction} from "@solana/web3.js";
import {getConnection, sendTransaction} from "@/api/context/connection";
import {depositReserveLiquidity} from "@/api/actions/utils/depositReserveLiquidity";
import {WalletAdapter} from "@/api/wallets";
import {depositObligationCollateral} from "@/api/actions/utils/depositObligationCollateral";
import {U64_MAX} from "@/api/constants/math";
import {depositMining} from "@/api/actions/utils/depositMing";
import BN from "bn.js";
import {initMining} from "@/api/actions/utils/initMining";
import {Mining} from "@/api/models/state/mining";
import {refreshReserve} from "@/api/actions/utils/refreshReserve";
import {ensureSplAccount} from "@/api/actions/utils/account";
import {Token, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {getMining} from "@/api/provider/miningProvider";
import {getObligation} from "@/api/provider/obligationProvider";
import {getBridgePool, getBridgeProgram} from "@/api/context/bridgePool";
import {LP_RESERVE_IDS} from "@/api/constants/config";
/**
 * @param source
 * @param liquidityAmount
 * @param wallet
 * @param reserve
 * @param destinationCollateralAccount
 */
export async function depositReserve(
    source: TokenAccount,
    liquidityAmount: BN,
    wallet: WalletAdapter,
    reserve: Detail<Reserve>,
    allReserve:Detail<Reserve>[],
    mining?:Detail<Mining>,
    destinationCollateralAccount?:PublicKey,
    obligation?:Detail<Obligation>

){
    const connection =await getConnection()
    if (wallet.publicKey == null || wallet.publicKey == undefined){
        throw new Error("Wallet need connected")
    }
    if (mining===undefined){
        const myMinings = await getMining(wallet.publicKey,'userAction')
        if (myMinings.length>0){
            mining = myMinings[0]
        }
    }
    if (obligation==undefined){
        const myObligations = await getObligation(wallet.publicKey,'userAction')
        if (myObligations.length>0){
            obligation = myObligations[0]
        }
    }
    const signers: Account[] = [];
    const instructions: TransactionInstruction[] = [];
    const cleanupInstructions: TransactionInstruction[] = [];
    // let signers: Account[] = [];
    // let instructions: TransactionInstruction[] = [];
    // let cleanupInstructions: TransactionInstruction[] = [];
    const balanceNeeded = await Token.getMinBalanceRentForExemptAccount(connection)
    const sourcePubkey = ensureSplAccount(
        instructions,
        cleanupInstructions,
        source,
        wallet.publicKey,
        liquidityAmount.toNumber()+balanceNeeded,
        signers
    )
    let miningID:PublicKey
    await refreshReserve(
        connection,
        signers,
        instructions,
        cleanupInstructions,
        reserve
    )
    destinationCollateralAccount = await depositReserveLiquidity(
        connection,
        signers,
        instructions,
        cleanupInstructions,
        sourcePubkey,
        liquidityAmount,
        wallet,
        reserve,
        destinationCollateralAccount
    )
    if (mining == undefined){
        miningID = await initMining(
            connection,
            signers,
            instructions,
            cleanupInstructions,
            reserve.info.lendingMarket,
            wallet
        )
    } else {

        miningID = mining.pubkey
    }
    if (obligation != undefined) {
        let opened = false
        obligation.info.deposits.map((collateralDetail: ObligationCollateral) => {
            if (collateralDetail.depositReserve.equals(reserve.pubkey)) {
                //开启过抵押
                opened = true
            }
        })
        if (opened) {
            await refreshReserve(
                connection,
                signers,
                instructions,
                cleanupInstructions,
                reserve
            )
            await depositObligationCollateral(
                connection,
                signers,
                instructions,
                cleanupInstructions,
                wallet,
                U64_MAX,
                destinationCollateralAccount,
                reserve,
                obligation,
            )
        } else {
            await refreshReserve(
                connection,
                signers,
                instructions,
                cleanupInstructions,
                reserve
            )
            await depositMining(
                connection,
                signers,
                instructions,
                cleanupInstructions,
                destinationCollateralAccount,
                reserve,
                U64_MAX,
                wallet,
                reserve.info.lendingMarket,
                miningID
            )
        }
    } else {
        await refreshReserve(
            connection,
            signers,
            instructions,
            cleanupInstructions,
            reserve
        )
        await depositMining(
            connection,
            signers,
            instructions,
            cleanupInstructions,
            destinationCollateralAccount,
            reserve,
            U64_MAX,
            wallet,
            reserve.info.lendingMarket,
            miningID
        )

    }
    const result =  await sendTransaction(
        connection,
        wallet,
        instructions.concat(cleanupInstructions),
        signers,
        true,
    )
    // if (reserve.info.isLP){
    //     console.log("is_lp 1")
    //     const bridgeProgram = await getBridgeProgram()
    //     const bridgePool = await getBridgePool(reserve.info.liquidity.params_1)
    //     signers = []
    //     instructions = []
    //     cleanupInstructions = []
    //     LP_RESERVE_IDS.map(lpReserveConfig => {
    //         if (lpReserveConfig.reserveID.equals(reserve.pubkey)){
    //             instructions.push(bridgeProgram.instruction.stake({
    //                 accounts:{
    //                     pool:reserve.info.liquidity.params_1,
    //                     bridgePoolLpSupply:bridgePool.lpSupply,
    //                     farmPoolProgramId:lpReserveConfig.farmPoolProgramId,
    //                     farmPool:bridgePool.farmPoolId,
    //                     farmPoolAuthority:lpReserveConfig.farmPoolAuthority,
    //                     farmPoolLpSupply:lpReserveConfig.farmPoolLpSupply,
    //                     farmLedger:bridgePool.farmLedger,
    //                     rewardAccount:bridgePool.rewardSupply[0],
    //                     rewardVault:lpReserveConfig.farmRewardVault,
    //                     sysvarClock:SYSVAR_CLOCK_PUBKEY,
    //                     tokenProgram:TOKEN_PROGRAM_ID,
    //                     rewardAccountB:bridgePool.rewardSupply.length==2?bridgePool.rewardSupply[1]:bridgePool.rewardSupply[0],
    //                     rewardVaultB:lpReserveConfig.farmRewardVaultB?lpReserveConfig.farmRewardVaultB:lpReserveConfig.farmRewardVault
    //                 },
    //             }))
    //         }
    //     })
    //     return await sendTransaction(
    //         connection,
    //         wallet,
    //         instructions.concat(cleanupInstructions),
    //         signers,
    //         true,
    //     )
    //
    // }
    return result
}