import { TVerification, TTask } from '@/types';

type TProps = {
  tasks: TTask[];
  verifications: TVerification[];
  className?: string;
  devMode: boolean
};

export default TProps;
