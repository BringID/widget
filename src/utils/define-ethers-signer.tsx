import { ethers } from 'ethers'
 
export async function defineEthersSigner(walletClient: any) {
  const { account, chain, transport } = walletClient

  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  }
  const provider = new ethers.BrowserProvider(transport, network)
  const signer = await provider.getSigner(account.address)
  return {
    signer,
    provider
  }
}

export default defineEthersSigner