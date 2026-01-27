import {
  TOAuthResponse,
  TOAuthResponsePayload,
  TTask
} from '../types'
import {
  isValidAuthErrorPayload,
  isValidAuthSuccessPayload
} from '../utils'
import configs from '@/app/configs'

type TGetOAuthSemaphoreData = (
  task: TTask,
  plausibleEvent: (eventName: string) => void
) => Promise<
  TOAuthResponsePayload
>

const getOAuthSemaphoreData: TGetOAuthSemaphoreData = (
  task,
  plausibleEvent
) => {

  return new Promise((resolve, reject) => {
    const popup = window.open(
      `${configs.AUTH_DOMAIN}/${task.oauthUrl}`,
      "oauth",
      "width=400,height=600,popup=yes"
    )

    if (!popup) {
      reject("POPUP_BLOCKED")
      return
    }

    const cleanup = () => {
      clearInterval(timer)
      window.removeEventListener("message", handler)
    }

    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        cleanup()
        console.log("Popup closed");
        reject('POPUP_CLOSED')
      }
    }, 500);

    const handler = async (event: MessageEvent) => {
      if (event.origin !== configs.AUTH_DOMAIN) return
      if (event.source !== popup) return
      if (!event.data || typeof event.data !== 'object' || !event.data.type) {
        console.warn('Invalid message structure received')
        return
      }

      const data = event.data as TOAuthResponse

      switch (data.type) {
        case "AUTH_SUCCESS": {
          console.log({ data })
          if (!isValidAuthSuccessPayload(data.payload)) {
            cleanup()
            reject('INVALID_PAYLOAD_STRUCTURE')
            break
          }

          const { message, signature } = data.payload
          plausibleEvent('oauth_verification_response_received')
          cleanup()
          resolve({ message, signature })
          break
        }

        case "AUTH_ERROR": {
          if (!isValidAuthErrorPayload(data.payload)) {
            cleanup()
            reject('INVALID_ERROR_PAYLOAD')
            break
          }

          cleanup()
          plausibleEvent('oauth_verification_failed')

          reject(event.data.payload.error)
          break
        }
      }
    }

    window.addEventListener("message", handler)
  })

  
};

export default getOAuthSemaphoreData
