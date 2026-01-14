import { TModeConfigs, TVerification } from '@/types';

type TCreateVerification = (
  credentialGroupId: string,
  idHash: string,
  identityCommitment: string,
  verifierSignature: string,
  modeConfigs: TModeConfigs
) => Promise<TVerification | void>;

export default TCreateVerification;
