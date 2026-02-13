import { ethers } from 'ethers'
import chains from '@/app/configs/chains'

function getProvider(chainId: string) {
  const chain = chains[Number(chainId)]
  if (!chain) {
    throw new Error(`Chain ${chainId} not supported`)
  }
  return new ethers.JsonRpcProvider(chain.rpcUrls[0])
}

export async function getAppSemaphoreGroupId(
  registryAddress: string,
  credentialGroupId: string,
  appId: string,
  chainId: string
): Promise<string> {
  const provider = getProvider(chainId)
  const registry = new ethers.Contract(
    registryAddress,
    ['function appSemaphoreGroups(uint256, uint256) view returns (uint256)'],
    provider
  )
  const groupId = await registry.appSemaphoreGroups(credentialGroupId, appId)
  return groupId.toString()
}

export async function getScore(
  registryAddress: string,
  appId: string,
  credentialGroupId: string,
  chainId: string
): Promise<number> {
  const provider = getProvider(chainId)
  const registry = new ethers.Contract(
    registryAddress,
    ['function apps(uint256) view returns (uint8 status, uint256 recoveryTimelock, address admin, address scorer)'],
    provider
  )
  const app = await registry.apps(appId)
  const scorerAddress = app.scorer

  const scorer = new ethers.Contract(
    scorerAddress,
    ['function getScore(uint256) view returns (uint256)'],
    provider
  )
  const score = await scorer.getScore(credentialGroupId)
  return Number(score)
}

export async function getAllScores(
  registryAddress: string,
  appId: string,
  chainId: string
): Promise<Map<string, number>> {
  const provider = getProvider(chainId)
  const registry = new ethers.Contract(
    registryAddress,
    ['function apps(uint256) view returns (uint8 status, uint256 recoveryTimelock, address admin, address scorer)'],
    provider
  )
  const app = await registry.apps(appId)
  const scorerAddress = app.scorer

  if (!scorerAddress || scorerAddress === ethers.ZeroAddress) {
    return new Map<string, number>()
  }

  const scorer = new ethers.Contract(
    scorerAddress,
    ['function getAllScores() view returns (uint256[], uint256[])'],
    provider
  )
  const [groupIds, scores] = await scorer.getAllScores()

  const scoresMap = new Map<string, number>()
  for (let i = 0; i < groupIds.length; i++) {
    scoresMap.set(groupIds[i].toString(), Number(scores[i]))
  }
  return scoresMap
}
