import { TTaskGroup } from "./task-group"
import TVerificationType from "./verification-type";


type TTask = {
  id: string;
  title: string;
  description?: string;
  icon: string;
  verificationType: TVerificationType
  verificationUrl: string
  groups: TTaskGroup[];
  service: string;
  permissionUrl?: string[],
  steps: any
};

export default TTask;

