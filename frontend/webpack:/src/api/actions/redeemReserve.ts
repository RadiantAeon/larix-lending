import {
    Detail, Obligation,
    Reserve,
    TokenAccount
} from "@/api/models";
import {
    Account,
    Keypair,
    PublicKey,
    Signer,
    SystemProgram,
    SYSVAR_CLOCK_PUBKEY,
    TransactionInstruction
} from "@solana/web3.js";

import {redeemReserveCollateral} from "@/api/actions/utils/redeemReserveCollateral";
import BN from "bn.js"
import {getObligation} from "@/api/provider/obligationProvider";
import {getConnection, sendTransaction} from "@/api/context/connection";
import {Mining} from "@/api/models/state/mining";
import {withdrawMining} from "@/api/actions/utils/withdrawMining";
import {U64_MAX} from "@/api/constants/math";
import {withdrawObligationCollateral} from "@/api/actions/utils/withdrawObligationCollateral";
import {refreshReserve} from "@/api/actions/utils/refreshReserve";
import {getOrCreateAssociatedTokenAccount, findOrCreateAccountByMint} from "@/api/actions/utils/account";
import {getMining} from "@/api/provider/miningProvider";
import {withdrawLpAccountProvider} from "@/api/provider/withdrawLpAccountProvider";
import {getBridgePool, getBridgeProgram} from "@/api/context/bridgePool";
import {LP_RESERVE_IDS} from "@/api/constants/config";
import {NATIVE_MINT, TOKEN_PROGRAM_ID} from "@solana/spl-token";

export async function redeemReserve(
    source: TokenAccount,
    collateralAmount: BN,
    wallet: any,
    redeemReserveDetail: Detail<Reserve>,
    destinationLiquidity: TokenAccount,
    allReserve: Array<Detail<Reserve>>,
    mining: Detail<Mining>,
    obligation?: Detail<Obligation>,
) {
    let signers: Signer[] = [];
    let instructions: TransactionInstruction[] = [];
    let cleanupInstructions: TransactionInstruction[] = [];
    const connection = await getConnection()
    let sourceAddress;
    if (source == undefined) {
        sourceAddress = await getOrCreateAssociatedTokenAccount(
            connection,
            instructions,
            wallet.publicKey,
            redeemReserveDetail.info.collateral.mintPubkey,
            wallet.publicKey,
        )
    } else {
        sourceAddress = source.pubkey
    }
    if (mining === undefined) {
        const myMinings = await getMining(wallet.publicKey, 'userAction')
        if (myMinings.length > 0) {
            mining = myMinings[0]
        }
    }
    if (obligation === undefined) {
        const myObligations = await getObligation(wallet.publicKey, 'userAction')
        if (myObligations.length > 0) {
            obligation = myObligations[0]
        }
    }

    let hasObligation: boolean = false
    if (obligation != undefined) {
        obligation.info.deposits.map((collateral) => {
            if (collateral.depositReserve.equals(redeemReserveDetail.pubkey)) {
                hasObligation = true
            }
        })
    }
    let result = ""
    if (hasObligation) {
        if (obligation != undefined) {
            await withdrawObligationCollateral(
                connection,
                signers,
                instructions,
                cleanupInstructions,
                obligation,
                collateralAmount.cmp(new BN(-1)) == 0 ? U64_MAX : collateralAmount,
                sourceAddress,
                redeemReserveDetail,
                wallet,
                allReserve
            )
            //deal withdraw SOL
            if (redeemReserveDetail.info.liquidity.mintPubkey.equals(NATIVE_MINT)){
                if (obligation.info.deposits.length+obligation.info.borrows.length>=4){// 该值经过前端测试得出，暂时先这样
                    console.log("5")
                    let hasLpDeposit = false
                    obligation.info.deposits.map(deposit => {
                        LP_RESERVE_IDS.map(lpReserveConfig => {
                            if (deposit.depositReserve.equals(lpReserveConfig.reserveID)){
                                hasLpDeposit = true
                            }
                        })
                    })
                    if (hasLpDeposit){
                        await sendTransaction(
                            connection,
                            wallet,
                            instructions.concat(cleanupInstructions),
                            signers,
                            true,
                        );
                        instructions = []
                        cleanupInstructions = []
                        signers = []
                    }
                }
            }

        }
    } else {

        await refreshReserve(
            connection,
            signers,
            instructions,
            cleanupInstructions,
            redeemReserveDetail
        )
        await withdrawMining(
            connection,
            signers,
            instructions,
            cleanupInstructions,
            mining.pubkey,
            sourceAddress,
            redeemReserveDetail,
            collateralAmount.cmp(new BN(-1)) == 0 ? U64_MAX : collateralAmount,
            wallet,
            redeemReserveDetail.info.lendingMarket
        )
    }
    const destinationLiquidityPubkey = await findOrCreateAccountByMint(
        wallet.publicKey,
        wallet.publicKey,
        instructions,
        cleanupInstructions,
        redeemReserveDetail.info.liquidity.mintPubkey,
        signers,
        destinationLiquidity
    )

    const withdrawLpPublicKeys:PublicKey[] = []
    if (redeemReserveDetail.info.isLP){
        const withdrawLpAccounts = await withdrawLpAccountProvider(wallet.publicKey,redeemReserveDetail.info.liquidity.params_1)
        // Create a new account to receive LP proof
        if (withdrawLpAccounts.length == 0){
            const bridgePoolProgram =await getBridgeProgram()
            const withdrawLpAccount = Keypair.generate()
            instructions.push(bridgePoolProgram.instruction.initializeWithdrawLpAccount({
                accounts:{
                    withdrawLpAccount: withdrawLpAccount.publicKey,
                    owner: wallet.publicKey,
                    pool: redeemReserveDetail.info.liquidity.params_1,
                    systemProgram: SystemProgram.programId
                }
            }))
            signers.push(withdrawLpAccount)
            withdrawLpPublicKeys.push(withdrawLpAccount.publicKey)
            if (obligation){
                // Transactions may exceed
                if (obligation.info?.deposits.length+obligation.info?.borrows.length>=4){
                    await sendTransaction(
                        connection,
                        wallet,
                        instructions.concat(cleanupInstructions),
                        signers,
                        true,
                    );
                    instructions = []
                    cleanupInstructions = []
                    signers = []
                }
            }

        } else {
            withdrawLpAccounts.map(account => {
                withdrawLpPublicKeys.push(account.pubkey)
            })
        }
    }

    await redeemReserveCollateral(
        connection,
        signers,
        instructions,
        cleanupInstructions,
        sourceAddress,
        collateralAmount.cmp(new BN(-1)) == 0 ? U64_MAX : collateralAmount,
        wallet,
        redeemReserveDetail,
        destinationLiquidityPubkey,
        withdrawLpPublicKeys[0]
    )
    result = await sendTransaction(
        connection,
        wallet,
        instructions.concat(cleanupInstructions),
        signers,
        true,
    );
    if (redeemReserveDetail.info.isLP){
        const bridgePoolProgram =await getBridgeProgram()
        const bridgePool = await getBridgePool(redeemReserveDetail.info.liquidity.params_1)


        instructions = []
        cleanupInstructions = []
        signers = []
        const withdrawLpAccount = withdrawLpPublicKeys[0]
        LP_RESERVE_IDS.map(lpReserveConfig => {
            if (redeemReserveDetail.pubkey.equals(lpReserveConfig.reserveID)){
                if (bridgePool.isFarm){
                    instructions.push(bridgePoolProgram.instruction.withdrawFarmLp({
                        accounts:{
                            pool:redeemReserveDetail.info.liquidity.params_1,
                            bridgePoolLpSupply:bridgePool.lpSupply,
                            withdrawAccount:withdrawLpAccount,
                            owner:wallet.publicKey.toString(),
                            farmPoolProgramId:lpReserveConfig.farmPoolProgramId,
                            farmPool:bridgePool.farmPoolId,
                            farmPoolAuthority:lpReserveConfig.farmPoolAuthority,
                            farmLedger:bridgePool.farmLedger,
                            userLpTokenAccount:destinationLiquidityPubkey,
                            farmPoolLpSupply:lpReserveConfig.farmPoolLpSupply,
                            rewardAccount:bridgePool.rewardSupply[0],
                            rewardVault:lpReserveConfig.farmRewardVault,
                            sysvarClock:SYSVAR_CLOCK_PUBKEY,
                            tokenProgram:TOKEN_PROGRAM_ID,
                            rewardAccountB:bridgePool.rewardSupply.length==1?bridgePool.rewardSupply[0]:bridgePool.rewardSupply[1],
                            rewardVaultB:bridgePool.rewardSupply.length==1?lpReserveConfig.farmRewardVault:lpReserveConfig.farmRewardVaultB
                        }
                    }))
                } else {
                    instructions.push(bridgePoolProgram.instruction.withdrawLp({
                        accounts:{
                            pool:redeemReserveDetail.info.liquidity.params_1,
                            bridgePoolLpSupply:bridgePool.lpSupply,
                            withdrawAccount:withdrawLpAccount,
                            owner:wallet.publicKey,
                            tokenProgram:TOKEN_PROGRAM_ID,
                            userLpTokenAccount:destinationLiquidityPubkey,
                        }
                    }))
                }

            }
        })
        // withdrawLpPublicKeys.map(withdrawLpAccount => {
        //
        // })
        return await sendTransaction(
            connection,
            wallet,
            instructions.concat(cleanupInstructions),
            signers,
            true,
        );
    } else {
        return result;
    }
}

