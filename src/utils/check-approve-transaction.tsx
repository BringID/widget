
import { ethers } from 'ethers'

const checkApproveTransaction = (
  contractInstance: ethers.Contract,
  userAddress: string,
  factoryAddress: string,
  totalAmount: bigint
) => {
  return async function (): Promise<boolean> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(async () => {
        const allowed = await contractInstance.allowance(userAddress, factoryAddress)
        if (allowed >= totalAmount) {
          resolve(true)
          clearInterval(checkInterval)
        }
      }, 1000)
    })
  }
}

export default checkApproveTransaction