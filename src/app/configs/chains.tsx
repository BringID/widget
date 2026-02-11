type TChains = {
  [chainId: number]: {
    chainName: string
    displayName: string
    testnet: boolean
    nativeCurrency: {
      name: string
      symbol: string
      decimals: number
    },
    rpcUrls: string[]
    blockExplorerUrls: string[]
  }
}

const chains: TChains = {
  8453: {
    chainName: 'Base',
    displayName: 'Base',
    testnet: false,
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: [
      'https://base-mainnet.g.alchemy.com/v2/90pmIGkw0z_nJyKH3t10f'
    ],
    blockExplorerUrls: [
      'https://basescan.org'
    ]
  },
  84532: {
    chainName: 'Base Sepolia',
    displayName: 'Base Sepolia',
    testnet: true,
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: [
      'https://base-sepolia.g.alchemy.com/v2/90pmIGkw0z_nJyKH3t10f'
    ],
    blockExplorerUrls: [
      'https://sepolia.basescan.org'
    ]
  }
}

export default chains