import { TModeConfigs, TTask } from '@/types';

async function loadConfigs(
  devMode: boolean
): Promise<{
    tasks: TTask[],
    configs: TModeConfigs
  }> {
  try {
    const isStaging = process.env.NEXT_PUBLIC_IS_STAGING === 'true'
    const configsFileName = devMode ? (isStaging ? 'dev-configs-staging' : 'dev-configs') : 'configs'
    const tasksFileName = devMode ? (isStaging ? 'tasks-sepolia-staging' : 'tasks-sepolia') : 'tasks'
    const configs = await fetch(`https://raw.githubusercontent.com/BringID/configs/main/${configsFileName}.json`)
    const tasks = await fetch(`https://raw.githubusercontent.com/BringID/configs/main/${tasksFileName}.json`)
    const tasksResponse = await tasks.json()
    const configsResponse = await configs.json()
    return {
      tasks: tasksResponse,
      configs: configsResponse
    }
  } catch (error) {
    console.error('Failed to parse tasks config:', error);
    return {
      tasks: [],
      configs: {
        REGISTRY: '',
        CHAIN_ID: ''
      }
    }
  }
}

export async function configs(
  devMode: boolean
): Promise<{
  tasks: TTask[],
  configs: TModeConfigs
}> {
  const {
    tasks,
    configs
  } = await loadConfigs(devMode)
  console.log('configs: ', {
    tasks,
    configs
  })
  return {
    tasks,
    configs
  }
}