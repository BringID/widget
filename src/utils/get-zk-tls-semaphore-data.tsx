import { TTask } from '../types'
import generateRequestId from './generate-request-id';
import { isValidZKTLSErrorMessage, isValidZKTLSSuccessMessage } from '@/utils';

type TGetZKTLSSemaphoreData = (
  task: TTask,
  plausibleEvent: (eventName: string) => void

) => Promise<
  {
    transcriptRecv: string,
    presentationData: string
  }
>

const getZKTLSSemaphoreData: TGetZKTLSSemaphoreData = (
  task,
  plausibleEvent
) => {
  return new Promise((resolve, reject) => {

    const cleanup = () => {
      clearTimeout(timeoutId)
      window.removeEventListener("message", handler)
    }

    const requestId = generateRequestId()

    window.postMessage({
      type: 'REQUEST_ZKTLS_VERIFICATION',
      payload: {
        task: JSON.stringify(task),
        origin: window.location.origin
      },
      requestId
    }, '*')


    const handler = async (event: MessageEvent) => {
      if (event.source !== window) return
  
      const readyPayload = isValidZKTLSSuccessMessage(event.data, requestId)
      if (readyPayload) {
        plausibleEvent('zktls_verification_response_received')
        resolve(readyPayload)
        cleanup()
        return
      }

      const errorPayload = isValidZKTLSErrorMessage(event.data, requestId)
      if (errorPayload) {
        plausibleEvent('zktls_verification_failed')
        cleanup()
        reject(errorPayload.error)
        return
      }
    }

    const timeoutId = setTimeout(() => {
      cleanup()
      reject('VERIFICATION_TIMED_OUT')
    }, 1800000) // 30 mins to finish

    window.addEventListener("message", handler)
  })

  
};

export default getZKTLSSemaphoreData
