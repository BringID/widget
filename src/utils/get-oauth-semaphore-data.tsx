import { TVerificationData, TTask, TTaskGroup } from '../types'
import { createQueryString } from '../utils'
import configs from '@/app/configs'

type TGetOAuthSemaphoreData = (
  task: TTask,
  group: TTaskGroup,
  semaphoreIdentity: any,
  registry: string,
  mode: string
) => Promise<
  TVerificationData
>

const getOAuthSemaphoreData: TGetOAuthSemaphoreData = (
  task,
  group,
  semaphoreIdentity,
  registry,
  mode
) => {

  const statePayload = {
    registry: registry,
    credential_group_id: group?.credentialGroupId,
    semaphore_identity_commitment: String(semaphoreIdentity.commitment),
    origin: window.location.origin,
    mode
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

    const handler = async (event: MessageEvent) => {
      console.log({ event, AUTH_DOMAIN: configs.AUTH_DOMAIN })
      if (event.origin !== configs.AUTH_DOMAIN) return

      if (event.data?.type === "AUTH_SUCCESS") {
        const {
          signature,
          verifier_hash,
          verifier_message: {
            id_hash
          }
        } = event.data.payload

        console.log({
          signature,
          verifier_hash,
          verifier_message: {
            id_hash
          }
        })

        clearInterval(timer)
        window.removeEventListener("message", handler)
        resolve({
          signature,
          verifier_hash,
          verifier_message: {
            id_hash
          }
        })
      }

      if (event.data?.type === "AUTH_ERROR") {
        clearInterval(timer)
        window.removeEventListener("message", handler)
        reject(event.data.payload.error)
      }
    }

    window.addEventListener("message", handler)
  })

  
};

export default getOAuthSemaphoreData
