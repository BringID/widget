import { TSemaphoreProofServer } from '@/types';

type TGetProofResponse = {
  success: boolean;
  proof: TSemaphoreProofServer;
};

type TGetProof = (
  apiUrl: string,
  identityCommitment: string,
  semaphoreGroupId: string,
  mode: string,
  fetchProofs?: boolean,
) => Promise<TGetProofResponse>;

export type { TGetProof, TGetProofResponse };
