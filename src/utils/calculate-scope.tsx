import { ethers } from 'ethers';

function calculateScope(appId: string, contractAddress: string, context: number = 0): string {
  console.log('[calculateScope] input:', { appId, contractAddress, context });

  const cleanAddress = contractAddress.toLowerCase().replace('0x', '');

  if (cleanAddress.length !== 40) {
    throw new Error('Invalid contract address length');
  }
  const fullAddress = '0x' + cleanAddress;

  const types = ['uint256', 'address', 'uint256'];
  const values = [BigInt(appId), fullAddress, context];

  const encoded = ethers.AbiCoder.defaultAbiCoder().encode(types, values);

  const hash = ethers.keccak256(encoded);

  const result = ethers.getBigInt(hash);

  console.log('[calculateScope] result:', result.toString());

  return result.toString();
}

export default calculateScope;
