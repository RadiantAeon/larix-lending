export const web3Config = {
    strategy: 'speed',
    rpcs: [
        { url: 'https://solana-api.projectserum.com', weight: 50 },
        { url: 'https://raydium.rpcpool.com', weight: 40 },
        { url: 'https://api.mainnet-beta.solana.com', weight: 10 }
    ]
}