import { TVerification } from '@/types';

type TGetVerification = (
  verificationId: string,
  mode: string
) => Promise<TVerification | void>;

export default TGetVerification;
