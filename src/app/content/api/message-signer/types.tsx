import { type ProofResult } from '@zkpassport/sdk'

type TSignedMessage = {
  message: {
    domain: string
    user_id: string
    score: number
    timestamp: number
  }
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
