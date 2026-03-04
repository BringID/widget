import { sdk } from '@farcaster/miniapp-sdk'

let _result: boolean | null = null

const isFarcasterApp = async (): Promise<boolean> => {
  if (_result !== null) {
    console.log('[isFarcasterApp] cached result:', _result)
    return _result
  }
  try {
    console.log('[isFarcasterApp] detecting...')
    const context = await Promise.race([
      sdk.context,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500))
    ])
    console.log('[isFarcasterApp] sdk.context resolved:', context)
    _result = !!context
  } catch (err) {
    console.log('[isFarcasterApp] sdk.context threw:', err)
    _result = false
  }
  console.log('[isFarcasterApp] result:', _result)
  return _result
}

export default isFarcasterApp
