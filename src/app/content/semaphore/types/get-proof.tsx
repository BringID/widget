import { TModeConfigs, TSemaphoreProofServer } from '@/types';

type TGetProof = (
  identityCommitment: string,
  semaphoreGroupId: string,
  modeConfigs: TModeConfigs,
  fetchProofs?: boolean,
) => Promise<TSemaphoreProofServer | void>;

export default TGetProof;
