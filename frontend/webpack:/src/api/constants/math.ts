import BN from 'bn.js';
import BigNumber from "bignumber.js";

export const U64_MAX = new BN("ffffffffffffffff","hex")
export const TEN = new BN(10);
export const HALF_WAD = TEN.pow(new BN(18));
export const WAD = TEN.pow(new BN(18));
export const ZERO = new BN(0);
export const BIG_NUMBER_WAD = new BigNumber(WAD.toString())
export const SLOTS_PER_YEAR = 1000/400  * 60 * 60 * 24 * 365
export const REAL_SLOTS_TIME = 500
export const REAL_SLOTS_PER_YEAR = 1000/REAL_SLOTS_TIME  * 60 * 60 * 24 * 365
export const REAL_SLOTS_PER_DAY = 1000/REAL_SLOTS_TIME * 60 * 60 * 24
export const IEO_LARIX_AMOUNT = 30666666.7
export const MSOL_LIMIT = 300000000
