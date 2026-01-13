import { TVerification } from '@/types';

type TCreateVerification = (
  credentialGroupId: string,
  idHash: string,
  identityCommitment: string,
  verifierSignature: string,
  mode: string
) => Promise<TVerification | void>;

export default TCreateVerification;
