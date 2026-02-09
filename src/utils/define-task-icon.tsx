import { Icons } from '@/components/common'

const defineTaskIcon = (
  taskIcon?: string
) => {
  switch (taskIcon) {
    case 'github':
      return Icons.GithubIcon

    case 'x':
      return Icons.XIcon

    case 'farcaster':
      return Icons.FarcasterIcon

    case 'okx':
      return Icons.OKXIcon

    case 'binance':
      return Icons.BinanceIcon

    case 'self':
      return Icons.SelfIcon

    case 'zkpassport':
      return Icons.ZKPassportIcon

    case 'uber':
      return Icons.UberIcon

    case 'apple':
      return Icons.AppleIcon
  
    default:
      return undefined
  }
}

export default defineTaskIcon
