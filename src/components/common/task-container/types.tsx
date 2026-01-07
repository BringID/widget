import React from 'react'
import { TTask, TTaskGroup, TVerificationStatus } from '@/types'

type TProps = {
  status: TVerificationStatus;
  children: React.ReactNode | React.ReactNode[];
  icon?: string;
  title: string;
  description?: string;
  selectable: boolean;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
  groups?: TTaskGroup[],
  id: string
};

export default TProps;
