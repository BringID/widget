import ISemaphore, { TGetProof, TCreateIdentity } from './types';
import { indexerApi } from '../api';
import { createSemaphoreIdentity, defineApiUrl } from '@/utils';

class Semaphore implements ISemaphore {
  #apiUrl: string;

  constructor() {
    this.#apiUrl = defineApiUrl();
  }

  getProof: TGetProof = async (
    identityCommitment,
    semaphoreGroupId,
    fetchProofs,
  ) => {
    const response = await indexerApi.getProof(
      this.#apiUrl,
      identityCommitment,
      semaphoreGroupId,
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
