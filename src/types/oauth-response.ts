import TOAuthMessage from './oauth-message'

export type OAuthResponsePayload = {
  message: TOAuthMessage,
  signature: string
}

export type OAuthErrorPayload = {
  error: string
}

export type OAuthSuccessResponse = {
  type: "AUTH_SUCCESS"
  payload: OAuthResponsePayload
}

export type OAuthErrorResponse = {
  type: "AUTH_ERROR"
  payload: OAuthErrorPayload
}

type OAuthResponse = OAuthSuccessResponse | OAuthErrorResponse

export default OAuthResponse