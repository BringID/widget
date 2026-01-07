import { TSemaphoreProof, TVerification } from "@/types";
import { defineTaskByCredentialGroupId, calculateScope } from "@/utils";
import semaphore from "../semaphore";
import { generateProof } from '@semaphore-protocol/core';
import getConfigs from "@/app/configs/mode-configs";

type TGetProofs = (
  userKey: string,
  verifications: TVerification[],
  scope: string | null,
  pointsRequired: number,
  selectedVerifications: string[],
) => Promise<TSemaphoreProof[]>;

const prepareProofs: TGetProofs = async (
  userKey,
  verifications,
  scope,
  pointsRequired,
  selectedVerifications,
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
      const relatedTask = defineTaskByCredentialGroupId(credentialGroupId, true);

      if (!relatedTask) {
        continue;
      }

      const { group } = relatedTask;

      totalScore = totalScore + group.points;
      const identity = semaphore.createIdentity(userKey, credentialGroupId);
      const { commitment } = identity;

      const data = await semaphore.getProof(
        String(commitment),
        group.semaphoreGroupId,
        true,
      );

      if (!data) {
        throw new Error('no proof found');
      }

      const scopeToUse = scope || calculateScope((await getConfigs()).REGISTRY);

      const { merkleTreeDepth, merkleTreeRoot, message, points, nullifier } =
        await generateProof(identity, data as any, 'verification', scopeToUse);

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