import { TTask } from '@/types';
import TasksSepolia from '../configs/tasks-sepolia.json'
import Tasks from '../configs/tasks.json'

function loadTasks(
  devMode: boolean
): TTask[] {
  try {
    const tasksConfig = devMode ? TasksSepolia : Tasks

    // Validate that it's an array
    if (!Array.isArray(tasksConfig)) {
      console.error('Tasks config is not an array');
      return [];
    }

    // Parse and validate each task
    return tasksConfig.map((task): TTask => {
      // Ensure required fields are present
      if (typeof task.title !== 'string' || !task.groups) {
        console.warn('Invalid task format:', task);
        throw new Error('Invalid task format');
      }

      return {
        title: task.title,
        oauthUrl: task.oauthUrl,
        id: task.id,
        description: task.description,
        icon: task.icon,
        groups: task.groups,
        service: task.service
      };
    });
  } catch (error) {
    console.error('Failed to parse tasks config:', error);
    return [];
  }
}

export function tasks(
  devMode: boolean
): TTask[] {
  const TASKS = loadTasks(devMode);
  return [...TASKS];
}
