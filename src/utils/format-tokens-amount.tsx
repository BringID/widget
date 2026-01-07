import { ethers } from 'ethers'

type TFormatAmount = (
  amount: string | bigint,
  decimals: number
) => string

const formatAmount: TFormatAmount = (amount, decimals) => {
  const amountFormatted = String(ethers.formatUnits(amount, decimals))
  if (amountFormatted.endsWith('.0')) {
    return amountFormatted.replace('.0', '')
  }

  return amountFormatted

}

export default formatAmount