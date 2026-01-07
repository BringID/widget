const defineNetworkName = (chainId: number | null) : string => {
  switch (chainId) {
    case 1: return 'Mainnet'
    case 137: return 'Polygon'
    case 8453: return 'Base'
    case 84532: return 'Base Sepolia'
    case 196: return 'xLayer'
    case 543210: return 'Zero'
    default: return 'Base'
  }
}
export default defineNetworkName