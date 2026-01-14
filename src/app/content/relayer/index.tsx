import IRelayer, { TCreateVerification, TGetVerification } from './types'
import taskManager from '../api/task-manager';
import { defineApiUrl } from '@/utils'

class Relayer implements IRelayer {
  #apiUrl: string;

  constructor() {
    this.#apiUrl = defineApiUrl();
  }

  createVerification: TCreateVerification = async (
    credentialGroupId,
    idHash,
    identityCommitment,
    verifierSignature,
    modeConfigs
  ) => {
    const { success, task } = await taskManager.addVerification(
      this.#apiUrl,
      credentialGroupId,
      idHash,
      identityCommitment,
      verifierSignature,
      modeConfigs
    );

    if (success) {
      const verification = {
        scheduledTime: task.scheduled_time,
        taskId: task.id,
        taskType: task.type,
        status: task.status,
        batchId: task.batch_id,
        credentialGroupId: task.credential_group_id,
        fetched: false,
      };

      return verification;
    }
  };

  getVerification: TGetVerification = async (
    verificationId, modeConfigs
  ) => {
    const { success, task } = await taskManager.getVerification(verificationId, modeConfigs);
    if (success) {
      const verification = {
        scheduledTime: task.scheduled_time,
        taskId: task.id,
        taskType: task.type,
        status: task.status,
        batchId: task.batch_id,
        credentialGroupId: task.credential_group_id,
        fetched: false,
        txHash: task.tx_hash,
      };

      return verification;
    }
  };
}

const relayer = new Relayer();

export default relayer;
