import { TModeConfigs, TSemaphoreProof, TTask, TVerification } from "@/types";
import { defineTaskByCredentialGroupId, calculateScope, getAppSemaphoreGroupId } from "@/utils";
import semaphore from "../semaphore";
import { generateProof, Group } from '@semaphore-protocol/core';
import { SemaphoreEthers } from '@semaphore-protocol/data';
import chains from '../../configs/chains';

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

  // Initialize SemaphoreEthers to fetch group members from chain
  const chain = chains[Number(modeConfigs.CHAIN_ID)];
  if (!chain) {
    throw new Error(`Chain ${modeConfigs.CHAIN_ID} not supported`);
  }
  const semaphoreEthers = new SemaphoreEthers(chain.rpcUrls[0], {
    address: modeConfigs.REGISTRY
  });

  // Process results and generate semaphore proofs
  const semaphoreProofs: TSemaphoreProof[] = [];
  const scopeToUse = scope || calculateScope(modeConfigs.REGISTRY);
  const messageToUse = message || 'verification';

  for (const item of verificationsToProcess) {
    // Fetch group members from chain and build a Group
    const members = await semaphoreEthers.getGroupMembers(item.semaphoreGroupId);
    const group = new Group();
    for (const member of members) {
      if (member !== '0') {
        group.addMember(member);
      }
    }

    const { merkleTreeDepth, merkleTreeRoot, message: proofMessage, points, nullifier } =
      await generateProof(item.identity, group, messageToUse, scopeToUse);

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