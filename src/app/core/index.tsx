import { TModeConfigs, TTask } from '@/types';

async function loadConfigs(
  devMode: boolean
): Promise<{
    tasks: TTask[],
    configs: TModeConfigs
  }> {
  try {

    const configsFileName = devMode ? 'dev-configs' : 'configs'
    const tasksFileName = devMode ? 'tasks-sepolia' : 'tasks'
    const configs = await fetch(`https://raw.githubusercontent.com/BringID/configs/main/${configsFileName}.json`)
    const tasks = await fetch(`https://raw.githubusercontent.com/BringID/configs/main/${tasksFileName}.json`)
    const tasksResponse = await tasks.json()
    const configsResponse = await configs.json()

    return {
      tasks: tasksResponse.map((task: any) => {
        task.icon = 'github'
        console.log(task)
        return task
      }),
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