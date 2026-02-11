import ISemaphore, {
  TGetProof,
  TCreateIdentity,
  TGetProofs
} from './types';
import { indexerApi } from '../api';
import { createSemaphoreIdentity, defineApiUrl } from '@/utils';
import { TModeConfigs } from '@/types';

class Semaphore implements ISemaphore {
  #apiUrl: string;

  constructor() {
    this.#apiUrl = defineApiUrl();
  }

  getProof: TGetProof = async (
    identityCommitment,
    semaphoreGroupId,
    modeConfigs,
    fetchProofs,
  ) => {
    const response = await indexerApi.getProof(
      this.#apiUrl,
      identityCommitment,
      semaphoreGroupId,
      modeConfigs,
      fetchProofs,
    );
    const { success, proof } = response;

    if (success) {
      return proof;
    }
  }

  getProofs: TGetProofs = async (
    data,
    modeConfigs,
    fetchProofs,
  ) => {
    const response = await indexerApi.getProofs(
      this.#apiUrl,
      data,
      modeConfigs,
      fetchProofs,
    );
    const { success, proofs } = response;

    if (success) {
      return proofs
    }
  }

  createIdentity: TCreateIdentity = (
    masterKey: string,
    appId: string,
    credentialGroupId: string,
  ) => {
    return createSemaphoreIdentity(masterKey, appId, credentialGroupId);
  };
}

const semaphore = new Semaphore();

export default semaphore;
