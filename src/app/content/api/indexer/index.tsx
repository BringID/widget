import configs from '../../../configs'

import {
  api,
  defineZuploNetworkName,
  createQueryString,
} from '@/utils';
import { TGetProof, TGetProofResponse } from './types';

const getProof: TGetProof = async (
  apiUrl,
  identityCommitment,
  semaphoreGroupId,
  modeConfigs,
  fetchProofs,
) => {
  const networkName = defineZuploNetworkName(modeConfigs.CHAIN_ID);
  const queryParams = createQueryString({
    identity_commitment: identityCommitment,
    semaphore_group_id: semaphoreGroupId,
    fetch_proofs: fetchProofs,
  });

  return api<TGetProofResponse>(
    `${apiUrl}/v1/indexer/${networkName}/proofs?${queryParams}`,
    'GET',
    {
      Authorization: `Bearer ${configs.ZUPLO_API_KEY}`,
    },
  );
};

const indexer = {
  getProof,
};

export default indexer;
