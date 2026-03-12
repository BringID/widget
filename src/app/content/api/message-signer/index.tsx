import configs from '../../../configs'
import { api } from '@/utils'
import { TSignFarcaster, TSignZKPassport } from './types'

const signFarcaster: TSignFarcaster = (signerEndpoint, message, signature, nonce) =>
  api(
    signerEndpoint,
    'POST',
    {
      Authorization: `Bearer ${configs.ZUPLO_API_KEY}`,
    },
    { message, signature, nonce },
  )

const signZKPassport: TSignZKPassport = (
  signerEndpoint,
  proofs,
  queryResult,
  uniqueIdentifier,
  domain,
) =>
  api(
    signerEndpoint,
    'POST',
    {
      Authorization: `Bearer ${configs.ZUPLO_API_KEY}`,
    },
    { proofs, queryResult, uniqueIdentifier, domain },
  )

const messageSignerApi = {
  signFarcaster,
  signZKPassport,
}

export default messageSignerApi
