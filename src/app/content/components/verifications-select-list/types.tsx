import { TVerification, TTask } from '@/types';

type TProps = {
  className?: string;
  tasks: TTask[];
  verifications: TVerification[];
  selected: string[];
  onSelect: (id: string, selected: boolean) => void;
  devMode: boolean
};

export default TProps;
