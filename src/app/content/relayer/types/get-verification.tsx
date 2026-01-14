import { TModeConfigs, TVerification } from '@/types';

type TGetVerification = (
  verificationId: string,
  modeConfigs: TModeConfigs
) => Promise<TVerification | void>;

export default TGetVerification;
