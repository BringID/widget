import {
  TOAuthResponse,
  TOAuthResponsePayload,
} from '../types'
import {
  isValidAuthErrorPayload,
  isValidAuthSuccessPayload
} from '.'
import { TTask } from '../types'

type TGetAuthSemaphoreData = (
  task: TTask,
  plausibleEvent: (eventName: string, options?: {
    props?: Record<string, string>
  }) => void,
  authUrl: string
) => Promise<
  TOAuthResponsePayload
>

const getAuthSemaphoreData: TGetAuthSemaphoreData = (
  task,
  plausibleEvent,
  authUrl
) => {

  const popupURL = authUrl
  const awaitingEventSource = new URL(authUrl).origin

  return new Promise((resolve, reject) => {
    const popup = window.open(
      // ,
      popupURL,
      "oauth",
      "width=400,height=600,popup=yes"
    )

    if (!popup) {
      plausibleEvent('oauth_popup_blocked')
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
        plausibleEvent('oauth_popup_closed')
        reject('POPUP_CLOSED')
      }
    }, 500);

    const handler = async (event: MessageEvent) => {

      if (event.origin !== awaitingEventSource) return
      if (event.source !== popup) return
      if (!event.data || typeof event.data !== 'object' || !event.data.type) {
        console.warn('Invalid message structure received')
        return
      }

      const data = event.data as TOAuthResponse

      switch (data.type) {
        case "AUTH_SUCCESS": {
          console.log('[AUTH_SUCCESS]', JSON.stringify(data, null, 2))
          if (!isValidAuthSuccessPayload(data.payload)) {
            cleanup()
            reject('INVALID_PAYLOAD_STRUCTURE')
            break
          }

          const { message, signature } = data.payload

          plausibleEvent('oauth_verification_response_received')
          plausibleEvent('verification_response_received', {
            props: {
              task_service: task.service
            }
          })
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
          plausibleEvent('oauth_verification_failed', {
            props: {
              verification_failed: task.service
            }
          })

          reject(event.data.payload.error)
          break
        }
      }
    }

    window.addEventListener("message", handler)
  })


};

export default getAuthSemaphoreData
