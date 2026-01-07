import { BrowserProvider } from "ethers"

const checkTransactionReceipt = async (
  provider: BrowserProvider,
  currentHash: string
) => {

  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      const receipt = await provider.getTransactionReceipt(currentHash)
      if (receipt && receipt.status !== undefined && receipt.status === 0) {
        return resolve(false)
      } else if (receipt && receipt.status !== undefined && receipt.status === 1) {
        return resolve(true)
      } else {
        return resolve(null)
      }
      window.clearInterval(interval)
    }, 2000)
  })
}

export default checkTransactionReceipt