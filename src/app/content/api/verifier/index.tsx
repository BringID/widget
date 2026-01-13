import { TVerify, TVerifyResponse } from './types'
import configs from '../../../configs'
import modeConfigs from '../../../configs/mode-configs'
import { createQueryString, api } from '@/utils'

const verify: TVerify = async (
  apiUrl,
  presentationData,
  registry,
  credentialGroupId,
  semaphoreIdentityCommitment,
  mode
) => {

  const configsResult = await modeConfigs(mode)
  const queryParams = createQueryString({
    environment: configsResult.CHAIN_ID === '84532' ? 'staging' : undefined,
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

const verifyService = {
  verify,
};

export default verifyService;
