export type TVerificationReadyPayload = {
  transcriptRecv: string
  presentationData: string
}

export type TVerificationErrorPayload = {
  error: string
}

export type TZKTLSExtensionResponse =
  | {
      type: 'VERIFICATION_DATA_READY'
      requestId: string
      payload: TVerificationReadyPayload
    }
  | {
      type: 'VERIFICATION_DATA_ERROR'
      requestId: string
      payload: TVerificationErrorPayload
    }


