import { TVerify, TVerifyOAuth, TVerifyResponse } from './types'
import configs from '../../../configs'
import { createQueryString, api } from '@/utils'

const verify: TVerify = async (
  apiUrl,
  presentationData,
  registry,
  credentialGroupId,
  semaphoreIdentityCommitment,
  mode
) => {

  const queryParams = createQueryString({
    environment: mode === 'dev' ? 'staging' : undefined,
  });

  return api<TVerifyResponse>(
    `${apiUrl}/v1/verifier/verify?${queryParams}`,
    'POST',
    {
      Authorization: `Bearer ${configs.ZUPLO_API_KEY}`,
    },
    {
      tlsn_presentation: presentationData,
      registry,
      credential_group_id: credentialGroupId,
      semaphore_identity_commitment: semaphoreIdentityCommitment,
    },
  );
};

const verifyOAuth: TVerifyOAuth = async (
  apiUrl,
  message,
  signature,
  registry,
  credentialGroupId,
  semaphoreIdentityCommitment,
  mode
) => {

  const queryParams = createQueryString({
    environment: mode === 'dev' ? 'staging' : undefined,
  });

  return api<TVerifyResponse>(
    `${apiUrl}/v1/verifier/verify/oauth?${queryParams}`, // https://verifier-staging.up.railway.app
    'POST',
    {
      Authorization: `Bearer ${configs.ZUPLO_API_KEY}`,
    },
    {
      message: {
        ...message,
        user_id: undefined,

        // @ts-ignore
        userId: message.user_id
      },
      signature,
      registry,
      credential_group_id: credentialGroupId,
      semaphore_identity_commitment: semaphoreIdentityCommitment,
    },
  );
};

const verifyService = {
  verify,
  verifyOAuth
};

export default verifyService;
