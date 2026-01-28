import { TVerificationReadyPayload } from '@/types'

function isValidZKTLSSuccessMessage(
  data: unknown,
  expectedRequestId: string
): TVerificationReadyPayload | null {
  if (!data || typeof data !== 'object') return null

  const msg = data as Record<string, unknown>

  if (msg.type !== 'VERIFICATION_DATA_READY') return null
  if (msg.requestId !== expectedRequestId) return null

  const payload = msg.payload as Record<string, unknown> | undefined
  if (
    !payload ||
    typeof payload.transcriptRecv !== 'string' ||
    typeof payload.presentationData !== 'string'
  ) {
    return null
  }

  return payload as TVerificationReadyPayload
}

  export default isValidZKTLSSuccessMessage