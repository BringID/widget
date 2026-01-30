
import isValidAuthMessage from "./is-valid-auth-message"

const isValidAuthSuccessPayload = (payload: any): boolean => {
  return (
    payload &&
    typeof payload === 'object' &&
    isValidAuthMessage(payload.message) &&
    typeof payload.signature === 'string' &&
    payload.signature.length > 0
  )
}

export default isValidAuthSuccessPayload