import { tasks } from '@/app/core'
import { TTaskGroup } from '../types'

type TDefineTaskByCredentialGroupId = (
  credentialGroupId: string,
  devMode: boolean
) =>
  {
    taskId: string;
    title: string;
    description?: string;
    icon?: string;
    group: TTaskGroup;
  }
| undefined;

const defineTaskByCredentialGroupId: TDefineTaskByCredentialGroupId = (
  credentialGroupId,
  devMode
) => {
  const availableTasks = tasks(devMode);
  for (const task of availableTasks) {
    for (const group of task.groups) {
      if (group.credentialGroupId === credentialGroupId) {
        return {
          taskId: task.id,
          title: task.title,
          description: task.description,
          icon: task.icon,
          group: group,
        };
      }
    }
  }
};

export default defineTaskByCredentialGroupId;
