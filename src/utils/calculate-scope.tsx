import { ethers } from 'ethers';

function calculateScope(contractAddress: string, context: number = 0): string {
  console.log('[calculateScope] input:', { contractAddress, context });

  const cleanAddress = contractAddress.toLowerCase().replace('0x', '');

  if (cleanAddress.length !== 40) {
    throw new Error('Invalid contract address length');
  }
  const fullAddress = '0x' + cleanAddress;

  const types = ['address', 'uint256'];
  const values = [fullAddress, context];

  const encoded = ethers.AbiCoder.defaultAbiCoder().encode(types, values);

  const hash = ethers.keccak256(encoded);

  const result = ethers.getBigInt(hash);

  console.log('[calculateScope] result:', result.toString());

  return result.toString();
}

export default calculateScope;
