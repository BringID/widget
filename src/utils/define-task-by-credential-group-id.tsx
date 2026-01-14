import { TTaskGroup, TTask } from '../types'

type TDefineTaskByCredentialGroupId = (
  credentialGroupId: string,
  tasks: TTask[]
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
  tasks
) => {
  for (const task of tasks) {
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
