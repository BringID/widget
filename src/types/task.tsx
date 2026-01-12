import { TTaskGroup } from "./task-group";

type TTask = {
  id: string;
  title: string;
  description?: string;
  icon: string;
  groups: TTaskGroup[];
  service: string;
  oauthUrl: string | undefined
};

export default TTask;
