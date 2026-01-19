import { TModeConfigs, TSemaphoreProof, TTask, TVerification } from "@/types";
import { defineTaskByCredentialGroupId, calculateScope } from "@/utils";
import semaphore from "../semaphore";
import { generateProof } from '@semaphore-protocol/core';

type TGetProofs = (
  tasks: TTask[],
  userKey: string,
  verifications: TVerification[],
  scope: string | null,
  pointsRequired: number,
  selectedVerifications: string[],
  modeConfigs: TModeConfigs
) => Promise<TSemaphoreProof[]>;

const prepareProofs: TGetProofs = async (
  tasks,
  userKey,
  verifications,
  scope,
  pointsRequired,
  selectedVerifications,
  modeConfigs
) => {

  if (!userKey) {
    throw new Error('userKey is not available');
  }
  const semaphoreProofs: TSemaphoreProof[] = [];
  let totalScore = 0;


  if (!verifications || verifications.length === 0) {
    throw new Error('no verifications found');
  }

  if (verifications) {
    for (let x = 0; x < verifications.length; x++) {
      if (
        !selectedVerifications.includes(verifications[x].credentialGroupId)
      ) {
        continue;
      }
      const { credentialGroupId, status } = verifications[x];
      if (totalScore >= pointsRequired) {
        break;
      }
      if (status !== 'completed') {
        continue;
      }
      const relatedTask = defineTaskByCredentialGroupId(credentialGroupId, tasks);

      if (!relatedTask) {
        continue;
      }

      const { group } = relatedTask;

      totalScore = totalScore + group.points;
      console.log({ userKey, credentialGroupId })
      const identity = semaphore.createIdentity(userKey, credentialGroupId);
      console.log({ identity })
      const { commitment } = identity;

      const data = await semaphore.getProof(
        String(commitment),
        group.semaphoreGroupId,
        modeConfigs,
        true
      );
      console.log({ data })

      if (!data) {
        throw new Error('no proof found');
      }

      const scopeToUse = scope || calculateScope(modeConfigs.REGISTRY);
      console.log({ scopeToUse })
      const { merkleTreeDepth, merkleTreeRoot, message, points, nullifier } =
        await generateProof(identity, data as any, 'verification', scopeToUse);

      console.log({ merkleTreeDepth, merkleTreeRoot, message, points, nullifier })
      semaphoreProofs.push({
        credential_group_id: credentialGroupId,
        semaphore_proof: {
          merkle_tree_depth: merkleTreeDepth,
          merkle_tree_root: merkleTreeRoot,
          nullifier: nullifier,
          message: message,
          scope: scopeToUse,
          points,
        },
      });
    }
  }

  return semaphoreProofs;
};

export default prepareProofs