import { OAuthResponse, OAuthResponsePayload, OAuthErrorPayload, TTask, TTaskGroup } from '../types'
import { createQueryString } from '../utils'
import configs from '@/app/configs'

type TGetOAuthSemaphoreData = (
  task: TTask
) => Promise<
  OAuthResponsePayload
>

const getOAuthSemaphoreData: TGetOAuthSemaphoreData = (
  task
) => {

  const statePayload = {
    origin: window.location.origin,
  }

  const queryParams = createQueryString({
    state: btoa(JSON.stringify(statePayload))
  })

  return new Promise((resolve, reject) => {
    const popup = window.open(
      `${configs.AUTH_DOMAIN}/${task.oauthUrl}?${queryParams}`,
      "oauth",
      "width=400,height=600,popup=yes"
    )

    if (!popup) {
      reject("POPUP_BLOCKED")
    }

    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        console.log("Popup closed");
        reject('POPUP_CLOSED')
      }
    }, 500);

    const handler = async (event: MessageEvent<OAuthResponse>) => {
      if (event.origin !== configs.AUTH_DOMAIN) return

      switch (event.data.type) {
        case "AUTH_SUCCESS": {
          const { message, signature } = event.data.payload

          clearInterval(timer)
          window.removeEventListener("message", handler)

          resolve({ message, signature })
          break
        }

        case "AUTH_ERROR": {
          clearInterval(timer)
          window.removeEventListener("message", handler)

          reject(event.data.payload.error)
          break
        }
      }
    }

    window.addEventListener("message", handler)
  })

  
};

export default getOAuthSemaphoreData
