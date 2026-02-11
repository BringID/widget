import React from 'react'
import { TVerificationStatus, TTaskGroup } from '@/types'

type TProps = {
  status: TVerificationStatus;
  children: React.ReactNode | React.ReactNode[];
  icon?: string;
  title: string;
  description?: string;
  selectable: boolean;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
  id: string;
  groups?: TTaskGroup[];
};

export default TProps;
