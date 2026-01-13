import { TTaskServer } from '@/types';

type TAddVerificationResponse = {
  success: boolean;
  task: TTaskServer;
};

type TAddVerification = (
  apiUrl: string,
  registry: string,
  credentialGroupId: string,
  idHash: string,
  identityCommitment: string,
  verifierSignature: string,
  mode: string
) => Promise<TAddVerificationResponse>;

type TGetVerificationResponse = {
  success: boolean;
  task: TTaskServer;
};

type TGetVerification = (
  verificationId: string,
  mode: string
) => Promise<TGetVerificationResponse>;

export type {
  TAddVerification,
  TGetVerification,
  TGetVerificationResponse,
  TAddVerificationResponse,
};
