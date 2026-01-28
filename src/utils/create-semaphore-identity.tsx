import { keccak256, AbiCoder } from 'ethers';
import { Identity } from '@semaphore-protocol/identity';

const createSemaphoreIdentity = (
  value1: string,
  value2: string,
) => {
  if (!value1 || !value2) {
    throw new Error('IDENTITY VALUES ARE NOT PROVIDED');
  }
  const coder = new AbiCoder();
  const encoded = coder.encode(
    ['string', 'string'],
    [value1, value2],
  );
  const identityKey = keccak256(encoded);
  const identity = new Identity(identityKey);
  return identity;
};

export default createSemaphoreIdentity;
