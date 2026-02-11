import { TModeConfigs, TTaskServer } from '@/types';

type TAddVerificationResponse = {
  success: boolean;
  task: TTaskServer;
};

type TAddVerification = (
  apiUrl: string,
  credentialGroupId: string,
  credentialId: string,
  appId: string,
  identityCommitment: string,
  verifierSignature: string,
  modeConfigs: TModeConfigs
) => Promise<TAddVerificationResponse>;

type TGetVerificationResponse = {
  success: boolean;
  task: TTaskServer;
};

type TGetVerification = (
  verificationId: string,
  modeConfigs: TModeConfigs
) => Promise<TGetVerificationResponse>;

export type {
  TAddVerification,
  TGetVerification,
  TGetVerificationResponse,
  TAddVerificationResponse,
};
