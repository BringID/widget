import { TSemaphoreProofServer } from '@/types';

type TGetProof = (
  identityCommitment: string,
  semaphoreGroupId: string,
  mode: string,
  fetchProofs?: boolean,
) => Promise<TSemaphoreProofServer | void>;

export default TGetProof;
