import { TVerificationStatus, TTask } from '@/types';

export type TProps = {
  status: TVerificationStatus
  task: TTask
  isActive: boolean
  setIsActive: (
    active: boolean
  ) => void
  onError: (errorText: string) => void
  onMessage: (message: string) => void
};
