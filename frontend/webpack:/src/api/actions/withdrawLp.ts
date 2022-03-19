import {Detail, Reserve, TokenAccount} from "@/api/models";
import {PublicKey, Signer, SYSVAR_CLOCK_PUBKEY, TransactionInstruction} from "@solana/web3.js";
import {getConnection, sendTransaction} from "@/api/context/connection";
import {getBridgePool, getBridgeProgram} from "@/api/context/bridgePool";
import {LP_RESERVE_IDS} from "@/api/constants/config";
import {TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {findOrCreateAccountByMint} from "@/api/actions/utils/account";

export async function withdrawLp(
    source: TokenAccount,
    wallet: any,
    withdrawLpAccount:PublicKey,
    redeemReserveDetail: Detail<Reserve>,
    destinationLiquidity: TokenAccount
) {
    const signers: Signer[] = [];
    const instructions: TransactionInstruction[] = [];
    const cleanupInstructions: TransactionInstruction[] = [];
    const connection = await getConnection()

    if (redeemReserveDetail.info.isLP) {
        const destinationLiquidityPubkey = await findOrCreateAccountByMint(
            wallet.publicKey,
            wallet.publicKey,
            instructions,
            cleanupInstructions,
            redeemReserveDetail.info.liquidity.mintPubkey,
            signers,
            destinationLiquidity
        )
        const bridgePoolProgram = await getBridgeProgram()
        const bridgePool = await getBridgePool(redeemReserveDetail.info.liquidity.params_1)
        LP_RESERVE_IDS.map(lpReserveConfig => {
            if (redeemReserveDetail.pubkey.equals(lpReserveConfig.reserveID)) {
                if (bridgePool.isFarm) {
                    instructions.push(bridgePoolProgram.instruction.withdrawFarmLp({
                        accounts: {
                            pool: redeemReserveDetail.info.liquidity.params_1,
                            bridgePoolLpSupply: bridgePool.lpSupply,
                            withdrawAccount: withdrawLpAccount,
                            owner: wallet.publicKey,
                            farmPoolProgramId: lpReserveConfig.farmPoolProgramId,
                            farmPool: bridgePool.farmPoolId,
                            farmPoolAuthority: lpReserveConfig.farmPoolAuthority,
                            farmLedger: bridgePool.farmLedger,
                            userLpTokenAccount: destinationLiquidityPubkey,
                            farmPoolLpSupply: lpReserveConfig.farmPoolLpSupply,
                            rewardAccount: bridgePool.rewardSupply[0],
                            rewardVault: lpReserveConfig.farmRewardVault,
                            sysvarClock: SYSVAR_CLOCK_PUBKEY,
                            tokenProgram: TOKEN_PROGRAM_ID,
                            rewardAccountB: bridgePool.rewardSupply.length == 1 ? bridgePool.rewardSupply[0] : bridgePool.rewardSupply[1],
                            rewardVaultB: bridgePool.rewardSupply.length == 1 ? lpReserveConfig.farmRewardVault : lpReserveConfig.farmRewardVaultB
                        }
                    }))
                } else {
                    instructions.push(bridgePoolProgram.instruction.withdrawLp({
                        accounts: {
                            pool: redeemReserveDetail.info.liquidity.params_1,
                            bridgePoolLpSupply: bridgePool.lpSupply,
                            withdrawAccount: withdrawLpAccount,
                            owner: wallet.publicKey,
                            tokenProgram: TOKEN_PROGRAM_ID,
                            userLpTokenAccount: destinationLiquidityPubkey,
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
    }
}