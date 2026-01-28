import TOAuthMessage from './oauth-message'

export type TOAuthResponsePayload = {
  message: TOAuthMessage,
  signature: string,
  secret: string
}

export type TOAuthErrorPayload = {
  error: string
}

export type TOAuthSuccessResponse = {
  type: "AUTH_SUCCESS"
  payload: TOAuthResponsePayload
}

export type TOAuthErrorResponse = {
  type: "AUTH_ERROR"
  payload: TOAuthErrorPayload
}

type OAuthResponse = TOAuthSuccessResponse | TOAuthErrorResponse

export default OAuthResponse