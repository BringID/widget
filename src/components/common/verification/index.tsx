import React, { FC, useState, useEffect } from 'react'
import { TProps } from './types'
import { Value, PointsCount } from './styled-components'
import { TVerificationStatus } from '@/types'
import { TaskContainer, Icons, Button } from '..'

import { msToTime, defineExplorerURL } from '@/utils'
import modeConfigs from '@/app/configs/mode-configs'
import { taskManagerApi } from '@/app/content/api'

const definePluginContent = (
  status: TVerificationStatus,
  points: number,
  expiration: null | number,
  fetched: boolean,
  onCheckTransactionClick?: () => void,
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
      return (
        <Button onClick={onCheckTransactionClick} size="small">
          Check TX
        </Button>
      );

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
    async () => {
      if (!taskId) {
        return alert('taskId not defined')
      }

      try {
        const result = await taskManagerApi.getVerification(taskId)

        if (result) {
          const { task } = result
          const configsResult = await modeConfigs()
          window.open(`${defineExplorerURL(Number(configsResult.CHAIN_ID || '84532'))}/tx/${task.tx_hash}`)
        }
      } catch (err) {
        alert('verification fetch has failed')
      }
    }
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
