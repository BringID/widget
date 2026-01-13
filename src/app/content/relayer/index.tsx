import IRelayer, { TCreateVerification, TGetVerification } from './types'
import taskManager from '../api/task-manager';
import modeConfigs from '@/app/configs/mode-configs'
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
    mode
  ) => {
    const configsResult = await modeConfigs(mode)
    const { success, task } = await taskManager.addVerification(
      this.#apiUrl,
      configsResult.REGISTRY,
      credentialGroupId,
      idHash,
      identityCommitment,
      verifierSignature,
      mode
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
    verificationId, mode
  ) => {
    const { success, task } = await taskManager.getVerification(verificationId, mode);
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
