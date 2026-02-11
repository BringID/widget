import { TModeConfigs, TSemaphoreProof, TTask, TVerification } from "@/types";
import { defineTaskByCredentialGroupId, calculateScope, getAppSemaphoreGroupId } from "@/utils";
import semaphore from "../semaphore";
import { generateProof } from '@semaphore-protocol/core';
import indexer from "../api/indexer";
import configs from '../../configs';

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

    const score = relatedTask.group.score ?? 0;
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

  // Fetch merkle proofs from the indexer in a single batch request
  const proofsResponse = await indexer.getProofs(
    configs.ZUPLO_API_URL,
    verificationsToProcess.map(item => ({
      identityCommitment: item.identity.commitment.toString(),
      semaphoreGroupId: item.semaphoreGroupId,
    })),
    modeConfigs,
    true
  );

  if (!proofsResponse.success || !proofsResponse.proofs) {
    throw new Error('Failed to fetch merkle proofs from indexer');
  }

  // Process results and generate semaphore proofs
  const semaphoreProofs: TSemaphoreProof[] = [];
  const scopeToUse = scope || calculateScope(modeConfigs.REGISTRY);
  const messageToUse = message || 'verification';

  for (let i = 0; i < verificationsToProcess.length; i++) {
    const item = verificationsToProcess[i];
    const proofData = proofsResponse.proofs[i];

    if (!('proof' in proofData) || !proofData.success) {
      throw new Error(`Failed to fetch merkle proof for credential group ${item.credentialGroupId}`);
    }

    // Convert indexer proof data to MerkleProof format (bigint values)
    const merkleProof = {
      root: BigInt(proofData.proof.root),
      leaf: BigInt(proofData.proof.leaf),
      index: proofData.proof.index,
      siblings: proofData.proof.siblings.map((s: string) => BigInt(s)),
    };

    const { merkleTreeDepth, merkleTreeRoot, message: proofMessage, points, nullifier } =
      await generateProof(item.identity, merkleProof, messageToUse, scopeToUse);

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