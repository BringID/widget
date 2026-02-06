import configs from '../../../configs'

import {
  api,
  defineZuploNetworkName,
  createQueryString,
} from '@/utils';
import {
  TGetProof,
  TGetProofResponse,
  TGetProofsResponse,
  TGetProofs
} from './types';

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


const getProofs: TGetProofs = async (
  apiUrl,
  data,
  modeConfigs,
  fetchProofs,
) => {
  const networkName = defineZuploNetworkName(modeConfigs.CHAIN_ID);

  return api<TGetProofsResponse>(
    `${apiUrl}/v1/indexer/${networkName}/proofs`,
    'POST',
    {
      Authorization: `Bearer ${configs.ZUPLO_API_KEY}`,
    },
    {
      data: data.map(proof => {
        return {
          identity_commitment: proof.identityCommitment,
          semaphore_group_id: proof.semaphoreGroupId,
        }
      }),
      fetchProofs
    }
  );
};

const indexer = {
  getProof,
  getProofs
};

export default indexer;
