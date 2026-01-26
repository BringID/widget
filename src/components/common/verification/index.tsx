import React, { FC, useState, useEffect } from 'react'
import { TProps } from './types'
import { Value, PointsCount } from './styled-components'
import { TVerificationStatus } from '@/types'
import { TaskContainer, Icons } from '..'

import { msToTime } from '@/utils'
import { useConfigs } from '@/app/content/store/reducers/configs'
import { TXScannerButton } from './components'

const definePluginContent = (
  status: TVerificationStatus,
  points: number,
  expiration: null | number,
  fetched: boolean,
  taskId: string
) => {
  switch (status) {
    case 'default':
      return <PointsCount>{points} pts</PointsCount>
    case 'pending':
      return <Icons.Clock />;
    case 'scheduled':
      return (
        <>
          <Icons.Clock />
          {msToTime(expiration || 0)} left
        </>
      );

    case 'completed':
      if (fetched) {
        return null
      }
      return <TXScannerButton taskId={taskId} />
    default:
      return <Icons.Check />;
  }
};

const Verification: FC<TProps> = ({
  title,
  taskId,
  points,
  icon,
  description,
  scheduledTime,
  status,
  selectable,
  selected,
  onSelect,
  credentialGroupId,
  fetched,
}) => {
  const [expiration, setExpiration] = useState<number | null>(null);
  const userConfigs = useConfigs()

  useEffect(() => {
    const interval = window.setInterval(async () => {
      const now = +new Date();
      const currentExpiration = scheduledTime - now;
      const updatedExpiration = currentExpiration <= 0 ? 0 : currentExpiration;
      setExpiration(updatedExpiration);

      if (updatedExpiration === 0) {
        window.clearInterval(interval);
      }
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const content = definePluginContent(
    status as TVerificationStatus,
    points,
    expiration,
    fetched,
    taskId as string
  );

  return (
    <TaskContainer
      status={status}
      selectable={selectable}
      title={title}
      description={description}
      icon={icon}
      selected={selected}
      onSelect={onSelect}
      id={credentialGroupId}
    >
      <Value>{content}</Value>
    </TaskContainer>
  );
};

export default Verification;
