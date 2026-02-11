import { TModeConfigs, TSemaphoreProof, TTask, TVerification } from "@/types";
import { defineTaskByCredentialGroupId, calculateScope, getAppSemaphoreGroupId, getScore } from "@/utils";
import semaphore from "../semaphore";
import { generateProof } from '@semaphore-protocol/core';

type TGetProofs = (
  tasks: TTask[],
  userKey: string,
  appId: string,
  verifications: TVerification[],
  scope: string | null,
  message: string | null,
  pointsRequired: number,
  selectedVerifications: string[],
  modeConfigs: TModeConfigs
) => Promise<TSemaphoreProof[]>;

const prepareProofs: TGetProofs = async (
  tasks,
  userKey,
  appId,
  verifications,
  scope,
  message,
  pointsRequired,
  selectedVerifications,
  modeConfigs
) => {

  if (!userKey) {
    throw new Error('userKey is not available');
  }

  if (!verifications || verifications.length === 0) {
    throw new Error('no verifications found');
  }

  // First pass: collect all needed identity data and calculate which verifications to include
  const verificationsToProcess: {
    credentialGroupId: string,
    identity: ReturnType<typeof semaphore.createIdentity>,
    semaphoreGroupId: string,
    score: number
  }[] = [];
  let totalScore = 0;

  for (let x = 0; x < verifications.length; x++) {
    if (!selectedVerifications.includes(verifications[x].credentialGroupId)) {
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

    const score = await getScore(modeConfigs.REGISTRY, appId, credentialGroupId, modeConfigs.CHAIN_ID);
    totalScore = totalScore + score;
    const identity = semaphore.createIdentity(userKey, appId, credentialGroupId);
    const semaphoreGroupId = await getAppSemaphoreGroupId(modeConfigs.REGISTRY, credentialGroupId, appId, modeConfigs.CHAIN_ID);

    verificationsToProcess.push({
      credentialGroupId,
      identity,
      semaphoreGroupId,
      score
    });
  }

  if (verificationsToProcess.length === 0) {
    return [];
  }

  // Batch fetch all proofs
  const proofsData = await semaphore.getProofs(
    verificationsToProcess.map(({ identity, semaphoreGroupId }) => ({
      identityCommitment: String(identity.commitment),
      semaphoreGroupId
    })),
    modeConfigs,
    true
  );

  if (!proofsData) {
    throw new Error('no proofs found');
  }

  // Process results and generate semaphore proofs
  const semaphoreProofs: TSemaphoreProof[] = [];
  const scopeToUse = scope || calculateScope(modeConfigs.REGISTRY);
  const messageToUse = message || 'verification';

  console.log({
    scopeToUse,
    messageToUse
  })

  for (const item of verificationsToProcess) {
    const proofResult = proofsData.find(
      p => p.identity_commitment === String(item.identity.commitment) &&
           p.semaphore_group_id === item.semaphoreGroupId
    );

    if (!proofResult || !proofResult.success) {
      throw new Error('no proof found');
    }

    console.log('generateProof inputs:', {
      identity: item.identity,
      proof: (proofResult as any).proof,
      messageToUse,
      scopeToUse
    });

    const { merkleTreeDepth, merkleTreeRoot, message: proofMessage, points, nullifier } =
      await generateProof(item.identity, (proofResult as any).proof as any, messageToUse, scopeToUse);

    semaphoreProofs.push({
      credential_group_id: item.credentialGroupId,
      app_id: appId,
      semaphore_proof: {
        merkle_tree_depth: merkleTreeDepth,
        merkle_tree_root: merkleTreeRoot,
        nullifier: nullifier,
        message: proofMessage,
        scope: scopeToUse,
        points,
      },
    });
  }

  return semaphoreProofs;
};

export default prepareProofs