import React, { FC } from 'react';
import { Container } from './styled-components';
import { Verification } from '@/components/common';
import TProps from './types';
import { defineTaskByCredentialGroupId } from '@/utils';
import { useConfigs } from '../../store/reducers/configs';

const VerificationsSelectList: FC<TProps> = ({
  verifications,
  onSelect,
  selected,
  className,
}) => {

  const userConfigs = useConfigs()
  return (
    <Container className={className}>
      {verifications.map((verification) => {
        if (verification.status !== 'completed') {
          return;
        }

        const relatedTaskData = defineTaskByCredentialGroupId(
          verification.credentialGroupId,
          userConfigs.tasks
        );

        if (relatedTaskData) {
          const { credentialGroupId, points } = relatedTaskData.group;
          const isSelected = selected.includes(credentialGroupId);

          return (
            <Verification
              key={credentialGroupId}
              title={relatedTaskData.title}
              description={relatedTaskData.description}
              taskId={verification.taskId}
              points={points}
              scheduledTime={verification.scheduledTime}
              status="default"
              fetched={verification.fetched}
              icon={relatedTaskData.icon}
              selectable={true}
              selected={isSelected}
              credentialGroupId={verification.credentialGroupId}
              onSelect={(selected) => {
                onSelect(credentialGroupId, selected);
              }}
            />
          );
        }
      })}
    </Container>
  );
};

export default VerificationsSelectList;
