import { TTaskGroupCheck } from './';

export type TTaskGroup = {
  points: number;
  semaphoreGroupId: string;
  credentialGroupId: string;
  checks?: TTaskGroupCheck[];
};
