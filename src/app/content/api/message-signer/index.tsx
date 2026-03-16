import configs from '../../../configs'
import { api } from '@/utils'
import { TSignFarcaster, TSignZKPassport } from './types'

const signFarcaster: TSignFarcaster = (signerEndpoint, message, signature, nonce, domain) =>
  api(
    `${signerEndpoint}/verify`,
    'POST',
    {
      Authorization: `Bearer ${configs.ZUPLO_API_KEY}`,
    },
    { message, signature, nonce, domain },
  )

const signZKPassport: TSignZKPassport = (
  signerEndpoint,
  proofs,
  queryResult,
  uniqueIdentifier,
  domain,
) =>
  api(
    `${signerEndpoint}/verify`,
    'POST',
    {
      Authorization: `Bearer ${configs.ZUPLO_API_KEY}`,
    },
    { proofs, query_result: queryResult, unique_identifier: uniqueIdentifier, domain },
  )

const messageSignerApi = {
  signFarcaster,
  signZKPassport,
}

export default messageSignerApi
