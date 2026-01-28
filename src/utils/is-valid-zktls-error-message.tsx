import { TVerificationErrorPayload } from '@/types'

export function isValidZKTLSErrorMessage(
  data: unknown,
  expectedRequestId: string
): TVerificationErrorPayload | null {
  if (!data || typeof data !== 'object') return null

  const msg = data as Record<string, unknown>

  if (msg.type !== 'VERIFICATION_DATA_ERROR') return null
  if (msg.requestId !== expectedRequestId) return null

  const payload = msg.payload as Record<string, unknown> | undefined
  if (!payload || typeof payload.error !== 'string') {
    return null
  }

  return payload as TVerificationErrorPayload
}

  export default isValidZKTLSErrorMessage
