import { sdk } from '@farcaster/miniapp-sdk'

let _result: boolean | null = null

const isFarcasterApp = async (log?: (msg: string) => void): Promise<boolean> => {
  const emit = (msg: string) => {
    console.log(msg)
    log?.(msg)
  }

  if (_result !== null) {
    emit(`[isFarcasterApp] cached result: ${_result}`)
    return _result
  }
  try {
    emit('[isFarcasterApp] detecting...')
    const context = await Promise.race([
      sdk.context,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500))
    ])
    emit(`[isFarcasterApp] sdk.context resolved: ${JSON.stringify(context)}`)
    _result = !!context
  } catch (err) {
    emit(`[isFarcasterApp] sdk.context threw: ${err}`)
    _result = false
  }
  emit(`[isFarcasterApp] result: ${_result}`)
  return _result
}

export default isFarcasterApp
