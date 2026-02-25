import { TTask } from '../types'
import generateRequestId from './generate-request-id';

type TGetZKTLSSemaphoreDataMobile = (
  task: TTask,
  plausibleEvent: (eventName: string) => void
) => Promise<{
  transcriptRecv: string,
  presentationData: string
}>

const BRIDGE_URL = process.env.NEXT_PUBLIC_MOBILE_BRIDGE_URL || 'http://localhost:3001'
const POLL_INTERVAL_MS = 3000
const TIMEOUT_MS = 1800000 // 30 mins

const getZKTLSSemaphoreDataMobile: TGetZKTLSSemaphoreDataMobile = (
  task,
  plausibleEvent
) => {
  return new Promise((resolve, reject) => {
    const sessionId = generateRequestId()
    const callbackUrl = `${BRIDGE_URL}/api/mobile-bridge/${sessionId}`

    let pollIntervalId: ReturnType<typeof setInterval>

    const cleanup = () => {
      clearTimeout(timeoutId)
      clearInterval(pollIntervalId)
    }

    const deepLink = `bringid:///notarize?taskId=${encodeURIComponent(task.id)}&callbackUrl=${encodeURIComponent(callbackUrl)}&sessionId=${encodeURIComponent(sessionId)}`
    // window.open works more reliably than location.href for custom URL
    // schemes triggered from within a cross-origin iframe on iOS Safari
    window.open(deepLink, '_blank')

    pollIntervalId = setInterval(async () => {
      try {
        console.log('[mobile-bridge] polling', callbackUrl)
        const response = await fetch(callbackUrl, { method: 'GET' })
        console.log('[mobile-bridge] poll status', response.status)
        if (response.status === 200) {
          const data = await response.json()
          console.log('[mobile-bridge] got data', data)
          plausibleEvent('zktls_verification_response_received')
          cleanup()
          resolve({
            transcriptRecv: data.transcriptRecv,
            presentationData: data.presentationData,
          })
        }
        // 202 = not ready yet, keep polling
      } catch (_err) {
        console.error('[mobile-bridge] poll error', _err)
      }
    }, POLL_INTERVAL_MS)

    const timeoutId = setTimeout(() => {
      cleanup()
      reject('VERIFICATION_TIMED_OUT')
    }, TIMEOUT_MS)
  })
}

export default getZKTLSSemaphoreDataMobile
