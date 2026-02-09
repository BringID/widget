import { TModeConfigs, TSemaphoreProofServer } from '@/types';

export type TProofSuccess = {
  success: boolean,
  proof: TSemaphoreProofServer
  identity_commitment: string
  semaphore_group_id: string
}

export type TProofError = {
  success: boolean,
  error: {
    message: string
    cause: string
  }
  identity_commitment: string
  semaphore_group_id: string
}

type TGetProofResponse = {
  success: boolean;
  proof: TSemaphoreProofServer;
};

type TGetProofsResponse = {
  success: boolean;
  proofs: (TProofSuccess | TProofError)[]
};

type TGetProof = (
  apiUrl: string,
  identityCommitment: string,
  semaphoreGroupId: string,
  modeConfigs: TModeConfigs,
  fetchProofs?: boolean,
) => Promise<TGetProofResponse>;


type TGetProofs = (
  apiUrl: string,
  data: {
    identityCommitment: string,
    semaphoreGroupId: string,
  }[],
  modeConfigs: TModeConfigs,
  fetchProofs?: boolean,
) => Promise<TGetProofsResponse>;

export type {
  TGetProof,
  TGetProofResponse,
  TGetProofs,
  TGetProofsResponse
};
