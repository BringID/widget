import ISemaphore, { TGetProof, TCreateIdentity } from './types';
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

  createIdentity: TCreateIdentity = (
    masterKey: string,
    credentialGroupId: string,
  ) => {
    return createSemaphoreIdentity(masterKey, credentialGroupId);
  };
}

const semaphore = new Semaphore();

export default semaphore;
