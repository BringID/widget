
import isValidOAuthMessage from "./is-valid-oauth-message"

const isValidAuthSuccessPayload = (payload: any): boolean => {
  return (
    payload &&
    typeof payload === 'object' &&
    isValidOAuthMessage(payload.message) &&
    typeof payload.signature === 'string' &&
    payload.signature.length > 0 &&
    typeof payload.secret === 'string'
  )
}

export default isValidAuthSuccessPayload