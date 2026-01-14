import { TVerification, TTask } from '@/types';

type TProps = {
  className?: string;
  verifications: TVerification[];
  selected: string[];
  onSelect: (id: string, selected: boolean) => void;
};

export default TProps;
