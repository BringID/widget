import { TNotarizationGroup } from "./notarization-group";

type TTask = {
  id: string;
  title: string;
  description?: string;
  icon: string;
  groups: TNotarizationGroup[];
  service: string;
  oauthUrl: string | undefined
};

export default TTask;
