import { sdk } from '@farcaster/miniapp-sdk'

let _result: boolean | null = null

const isFarcasterApp = async (): Promise<boolean> => {
  if (_result !== null) return _result
  try {
    const context = await Promise.race([
      sdk.context,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500))
    ])
    _result = !!context
  } catch {
    _result = false
  }
  return _result
}

export default isFarcasterApp
