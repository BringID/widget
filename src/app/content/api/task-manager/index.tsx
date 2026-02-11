import {
  TAddVerification,
  TAddVerificationResponse,
  TGetVerification,
  TGetVerificationResponse,
} from './types';
import configs from '@/app/configs/index';
import { defineZuploNetworkName, api } from '@/utils';

const addVerification: TAddVerification = async (
  apiUrl,
  credentialGroupId,
  credentialId,
  appId,
  identityCommitment,
  verifierSignature,
  modeConfigs
) => {

  const networkName = defineZuploNetworkName(modeConfigs.CHAIN_ID);

  return api<TAddVerificationResponse>(
    `${apiUrl}/v1/task-manager/${networkName}/verification/tasks`,
    'POST',
    {
      Authorization: `Bearer ${configs.ZUPLO_API_KEY}`,
    },
    {
      registry: modeConfigs.REGISTRY,
      credential_group_id: credentialGroupId,
      credential_id: credentialId,
      app_id: appId,
      identity_commitment: identityCommitment,
      verifier_signature: verifierSignature,
    },
  );
};

const getVerification: TGetVerification = async (taskId, modeConfigs) => {
  const networkName = defineZuploNetworkName(modeConfigs.CHAIN_ID);

  return api<TGetVerificationResponse>(
    `${configs.ZUPLO_API_URL}/v1/task-manager/${networkName}/verification/tasks/${taskId}`,
    'GET',
    {
      Authorization: `Bearer ${configs.ZUPLO_API_KEY}`,
    },
  );
};

const taskManager = {
  addVerification,
  getVerification,
};

export default taskManager;
