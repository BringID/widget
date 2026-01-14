import { TTaskGroup } from "./task-group";

type TTask = {
  id: string;
  title: string;
  description?: string;
  icon: string;
  groups: TTaskGroup[];
  service: string;
  permissionUrl?: string[],
  steps: any,
  oauthUrl?: string
};

export default TTask;

