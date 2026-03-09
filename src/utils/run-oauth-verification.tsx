import { TModeConfigs, TTask, TVerification } from '@/types'
import configs from '@/app/configs'
import { getAuthSemaphoreData } from '@/utils'
import submitOAuthVerification from './submit-oauth-verification'

type TRunOAuthVerificationParams = {
  task: TTask
  userKey: string
  appId: string
  modeConfigs: TModeConfigs
  mode: string
  redirectUrl: string | null
  isMiniApp: boolean
  plausible: (event: string, options?: { props?: Record<string, string> }) => void
  setLoading: (loading: boolean) => void
  setIsActive: (active: boolean) => void
  resultCallback: (verification: TVerification) => void
  messageCallback: (message: string, copyText?: string) => void
}

const runOAuthVerification = async (params: TRunOAuthVerificationParams): Promise<void> => {
  const {
    task, userKey, appId, modeConfigs, mode,
    redirectUrl, isMiniApp, plausible,
    setLoading, setIsActive, resultCallback, messageCallback,
  } = params

  const authUrl = task.verificationType === 'oauth'
    ? `${configs.AUTH_DOMAIN}/${task.verificationUrl}`
    : task.verificationUrl

  plausible('oauth_verification_started', { props: { verification_started: task.service } })
  plausible('verification_started', { props: { task_service: task.service } })

  if (redirectUrl) {
    const encodeParams = redirectUrl.includes('https://base.app') || redirectUrl.includes('cbwallet://')
    const finalUrl = `${authUrl}?redirect_url=${encodeURIComponent(redirectUrl)}&encode_params=${encodeParams}`
    if (encodeParams) {
      messageCallback('MANUAL_OPEN_LINK', finalUrl)
      return
    }
    if (isMiniApp) {
      window.postMessage({ type: 'OPEN_EXTERNAL_URL', payload: { url: finalUrl } }, window.location.origin)
    } else {
      window.open(finalUrl)
    }
    return
  }

  setLoading(true)
  setIsActive(true)

  const { message, signature } = await getAuthSemaphoreData(task, plausible, authUrl)

  const verification = await submitOAuthVerification(message, signature, { task, userKey, appId, modeConfigs, mode, plausible })

  setLoading(false)
  setIsActive(false)
  resultCallback(verification)
}

export default runOAuthVerification
