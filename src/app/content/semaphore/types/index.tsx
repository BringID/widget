import TGetProof from './get-proof';
import TCreateIdentity from './create-identity';
import TGetProofs from './get-proofs';

interface ISemaphore {
  getProof: TGetProof;
  getProofs: TGetProofs,
  createIdentity: TCreateIdentity;
}

export default ISemaphore;

export type { TGetProof, TCreateIdentity, TGetProofs };
