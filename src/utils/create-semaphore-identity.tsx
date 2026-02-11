import { keccak256, solidityPacked } from 'ethers';
import { Identity } from '@semaphore-protocol/identity';

const createSemaphoreIdentity = (
  masterKey: string,
  appId: string,
  credentialGroupId: string,
) => {
  if (!masterKey) {
    throw new Error('MASTER KEY IS NOT PROVIDED');
  }
  const masterKeyBytes32 = keccak256(masterKey);
  const encoded = solidityPacked(
    ['bytes32', 'uint256', 'uint256'],
    [masterKeyBytes32, appId, credentialGroupId],
  );
  const identityKey = keccak256(encoded);
  const identity = new Identity(identityKey);
  return identity;
};

export default createSemaphoreIdentity;
