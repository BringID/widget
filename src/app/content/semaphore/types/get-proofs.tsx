import { TModeConfigs, TSemaphoreProofServer } from '@/types';
import { TProofSuccess, TProofError } from '../../api/indexer/types';
type TGetProofs = (
  data: {
    identityCommitment: string,
    semaphoreGroupId: string,
  }[],
  modeConfigs: TModeConfigs,
  fetchProofs?: boolean,
) => Promise<((TProofSuccess | TProofError)[]) | void>;

export default TGetProofs;
