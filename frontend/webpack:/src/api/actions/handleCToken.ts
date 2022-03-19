import {refreshReserve} from "@/api/actions/utils/refreshReserve";
import {depositMining} from "@/api/actions/utils/depositMing";
import {U64_MAX} from "@/api/constants/math";
import {Account, Keypair, PublicKey, SystemProgram, SYSVAR_CLOCK_PUBKEY, TransactionInstruction} from "@solana/web3.js";
import {getConnection, sendTransaction} from "@/api/context/connection";
import {
    depositObligationCollateralInstruction,
    Detail,
    LendingMarket,
    Obligation,
    Reserve,
    TokenAccount
} from "@/api/models";
import {Mining} from "@/api/models/state/mining";
import {getMining} from "@/api/provider/miningProvider";
import {getObligation} from "@/api/provider/obligationProvider";
import {initObligation} from "@/api/actions/utils/initObligation";
import {LENDING_PROGRAM_ID, LP_RESERVE_IDS} from "@/api/constants/config";
import {redeemReserveCollateral} from "@/api/actions/utils/redeemReserveCollateral";
import {getBridgePool, getBridgeProgram} from "@/api/context/bridgePool";
import {TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {findOrCreateAccountByMint} from "@/api/actions/utils/account";
import {withdrawLpAccountProvider} from "@/api/provider/withdrawLpAccountProvider";

export async function handleCToken(
    sourceAccount:TokenAccount,
    mining:Detail<Mining>,
    reserveDetail:Detail<Reserve>,
    lendingMarket:Detail<LendingMarket>,
    wallet: any,
    type:string,
    obligation?:Detail<Obligation>,
    destinationLiquidity?: TokenAccount,
){
    let signers: Account[] = [];
    let instructions: TransactionInstruction[] = [];
    let cleanupInstructions: TransactionInstruction[] = [];
    const connection = await getConnection()

    if (mining===undefined){
        const myMinings = await getMining(wallet.publicKey,'userAction')
        if (myMinings.length>0){
            mining = myMinings[0]
        }
    }
    if (type == "depositMining"){
        await refreshReserve(
            connection,
            signers,
            instructions,
            cleanupInstructions,
            reserveDetail
        )
        console.log(' reserveDetail,', reserveDetail.pubkey.toString())
        await depositMining(
            connection,
            signers,
            instructions,
            cleanupInstructions,
            sourceAccount.pubkey,
            reserveDetail,
            U64_MAX,
            wallet,
            reserveDetail.info.lendingMarket,
            mining.pubkey
        )
        const result =  await sendTransaction(
            connection,
            wallet,
            instructions.concat(cleanupInstructions),
            signers,
            true,
        )
        return result
    } else if (type === "depositObligation"){
        const appendReserves: PublicKey[] = []
        if (obligation==undefined){
            const myObligations = await getObligation(wallet.publicKey,'userAction')
            if (myObligations.length>0){
                obligation = myObligations[0]
            }
        }

        let myObligationAddress:PublicKey
        if (obligation == undefined){
            myObligationAddress = await initObligation(
                connection,
                signers,
                instructions,
                cleanupInstructions,
                wallet,
                lendingMarket
            )
        } else {
            myObligationAddress = obligation.pubkey
            let newDeposit = true
            obligation.info.deposits.map(deposit => {
                if (deposit.depositReserve.equals(reserveDetail.pubkey)) {
                    newDeposit = false
                }
            })
            if (newDeposit){
                if (obligation!==undefined){
                    obligation.info.deposits.map(deposit2 => {
                        appendReserves.push(deposit2.depositReserve)
                    })
                    obligation.info.borrows.map(borrow => {
                        appendReserves.push(borrow.borrowReserve)
                    })
                }
            }
            console.log("appendReserves",appendReserves);
        }
        await refreshReserve(
            connection,
            signers,
            instructions,
            cleanupInstructions,
            reserveDetail
        )
        const [lendingMarketAuthority] = await PublicKey.findProgramAddress(
            [lendingMarket.pubkey.toBuffer()],
            LENDING_PROGRAM_ID,
        );

        instructions.push(
            depositObligationCollateralInstruction(
                U64_MAX,
                sourceAccount.pubkey,
                reserveDetail.info.collateral.supplyPubkey,
                reserveDetail.pubkey,
                myObligationAddress,
                reserveDetail.info.lendingMarket,
                lendingMarketAuthority,
                wallet.publicKey,
                wallet.publicKey,
                appendReserves
            ),
        );
        return await sendTransaction(
            connection,
            wallet,
            instructions.concat(cleanupInstructions),
            signers,
            true,
        );
    } else if (type === "withdraw"){
        const destinationLiquidityPubkey = await findOrCreateAccountByMint(
            wallet.publicKey,
            wallet.publicKey,
            instructions,
            cleanupInstructions,
            reserveDetail.info.liquidity.mintPubkey,
            signers,
            destinationLiquidity
        )
        if (reserveDetail.info.isLP){
            const withdrawLpPublicKeys:PublicKey[] = []
            if (reserveDetail.info.isLP){
                const withdrawLpAccounts = await withdrawLpAccountProvider(wallet.publicKey,reserveDetail.info.liquidity.params_1)
                if (withdrawLpAccounts.length == 0){
                    const bridgePoolProgram =await getBridgeProgram()
                    const withdrawLpAccount = Keypair.generate()
                    instructions.push(bridgePoolProgram.instruction.initializeWithdrawLpAccount({
                        accounts:{
                            withdrawLpAccount: withdrawLpAccount.publicKey,
                            owner: wallet.publicKey,
                            pool: reserveDetail.info.liquidity.params_1,
                            systemProgram: SystemProgram.programId
                        }
                    }))
                    // @ts-ignore
                    signers.push(withdrawLpAccount)
                    withdrawLpPublicKeys.push(withdrawLpAccount.publicKey)
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
                sourceAccount.pubkey,
                U64_MAX,
                wallet,
                reserveDetail,
                destinationLiquidityPubkey,
                withdrawLpPublicKeys[0]
            )
            await sendTransaction(
                connection,
                wallet,
                instructions.concat(cleanupInstructions),
                signers,
                true,
            );
            signers = []
            instructions = []
            cleanupInstructions = []
            const bridgePoolProgram =await getBridgeProgram()
            const bridgePool = await getBridgePool(reserveDetail.info.liquidity.params_1)
            const withdrawLpAccount = withdrawLpPublicKeys[0]
            LP_RESERVE_IDS.map(lpReserveConfig => {
                if (reserveDetail.pubkey.equals(lpReserveConfig.reserveID)){
                    if (bridgePool.isFarm){
                        instructions.push(bridgePoolProgram.instruction.withdrawFarmLp({
                            accounts:{
                                pool:reserveDetail.info.liquidity.params_1,
                                bridgePoolLpSupply:bridgePool.lpSupply,
                                withdrawAccount:withdrawLpAccount,
                                owner:wallet.publicKey,
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
                                pool:reserveDetail.info.liquidity.params_1,
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
            return await sendTransaction(
                connection,
                wallet,
                instructions.concat(cleanupInstructions),
                signers,
                true,
            );
        } else {
            await redeemReserveCollateral(
                connection,
                signers,
                instructions,
                cleanupInstructions,
                sourceAccount.pubkey,
                U64_MAX,
                wallet,
                reserveDetail,
                destinationLiquidityPubkey,
                undefined
            )
            return await sendTransaction(
                connection,
                wallet,
                instructions.concat(cleanupInstructions),
                signers,
                true,
            );
        }
    } else {
        throw new Error("Unsupported operation")
    }
}