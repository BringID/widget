import { type ProofResult } from '@zkpassport/sdk'
import TOAuthMessage from '@/types/oauth-message'

type TSignedMessage = {
  message: TOAuthMessage
  signature: string
}

type TSignFarcaster = (
  signerEndpoint: string,
  message: string,
  signature: string,
  nonce: string
) => Promise<TSignedMessage>

type TSignZKPassport = (
  signerEndpoint: string,
  proofs: ProofResult[],
  queryResult: unknown,
  uniqueIdentifier: string,
  domain: string
) => Promise<TSignedMessage>

export type { TSignFarcaster, TSignZKPassport, TSignedMessage }
