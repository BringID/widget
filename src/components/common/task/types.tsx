import { TTaskGroup, TVerificationStatus, TTask } from '@/types';

export type TProps = {
  status: TVerificationStatus;
  userKey: string | null;
  task: TTask
};
