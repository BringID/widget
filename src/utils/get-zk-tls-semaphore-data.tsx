import { TTask } from '../types'

type TGetZKTLSSemaphoreData = (
  task: TTask
) => Promise<
  {
    transcriptRecv: string,
    presentationData: string
  }
>

const getZKTLSSemaphoreData: TGetZKTLSSemaphoreData = (
  task,
) => {
  return new Promise((resolve, reject) => {

    // send the request to extension
    const bringIdInstalled = (window as any).bringID
    if (!bringIdInstalled) {
      reject('No extension installed')
    }

    window.postMessage({
      type: 'REQUEST_ZKTLS_VERIFICATION',
      payload: {
        task: JSON.stringify(task),
        origin: window.location.origin
      }
    }, '*') // You can restrict the origin in production


    const handler = async (event: MessageEvent) => {
      console.log({ event })

      if (event.data?.type === "VERIFICATION_DATA_READY") {

        const {
          transcriptRecv,
          presentationData
        } = event.data.payload

        window.removeEventListener("message", handler)
        resolve({
          transcriptRecv,
          presentationData
        })
      }

      if (event.data?.type === "VERIFICATION_DATA_ERROR") {
        window.removeEventListener("message", handler)
        reject(event.data.payload.error)
      }
    }

    window.addEventListener("message", handler)
  })

  
};

export default getZKTLSSemaphoreData
