import {Program} from "@project-serum/anchor";
import {PublicKey, SYSVAR_CLOCK_PUBKEY} from "@solana/web3.js";
import {LarixLockPool} from "@/api/models/state/larixLockPool";
import {LARIX_LOCK_FARM_INFO} from "@/api/constants/config";
import {TOKEN_PROGRAM_ID} from "@solana/spl-token";

export function createClaimPositionInstruction(
    program: Program,
    larixLockPoolId: PublicKey,
    larixLockPool: LarixLockPool,
    positionId: PublicKey,
    userRewardAccount:PublicKey,
    userRewardAccountB:PublicKey
){
    const user = program.provider.wallet.publicKey
    return program.instruction.claim(
        {
            accounts: {
                pool: larixLockPoolId,
                position: positionId,
                owner: user,
                tokenProgram: TOKEN_PROGRAM_ID,
                rewardAccount: larixLockPool.rewardASupply,
                rewardAccountB: larixLockPool.rewardBSupply,
                userRewardAccount,
                userRewardAccountB,

            }
        },
    );
}