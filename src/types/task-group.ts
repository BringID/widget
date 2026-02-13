import { TTaskGroupCheck } from './';

export type TTaskGroup = {
  credentialGroupId: string;
  checks: TTaskGroupCheck[];
  score?: number;
};
