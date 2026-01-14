import { FC } from 'react';

import {
  Container,
  NoteStyled,
  LinkStyled,
} from './styled-components';
import { Task, Verification } from '@/components/common';
import TProps from './types';
import { defineRelatedVerification, defineTaskByCredentialGroupId } from '@/utils';
import { useUser } from '../../store/reducers/user';
import { useConfigs } from '../../store/reducers/configs';

const VerificationsList: FC<TProps> = ({
  verifications,
  className,
}) => {

  const userConfigs = useConfigs()

  const user = useUser()
  const hasAnyPendingVerification = verifications.find(
    (verification) =>
      verification.status === 'scheduled' || verification.status === 'pending',
  );

  return (
    <Container className={className}>
      {hasAnyPendingVerification && (
        <NoteStyled>
          We batch verifications for better privacy.{' '}
          <LinkStyled href="https://bringid.org/privacy-policy" target="_blank">
            Learn more
          </LinkStyled>
        </NoteStyled>
      )}
      {/* {verifications.length === 0 && (
        <NoVerificationsFound title="No verifications yet" />
      )} */}
      {
        userConfigs.tasks.map((task) => {
          const relatedVerification = defineRelatedVerification(
            task,
            verifications
          )

          console.log({ relatedVerification })

          if (relatedVerification) {
             const relatedTaskData = defineTaskByCredentialGroupId(
              relatedVerification.credentialGroupId,
              userConfigs.tasks
            )

            console.log({ relatedTaskData })


            if (relatedTaskData) {
              return (
                <Verification
                  fetched={relatedVerification.fetched}
                  key={relatedVerification.taskId}
                  title={task.title}
                  description={task.description}
                  taskId={relatedVerification.taskId}
                  points={relatedTaskData.group.points}
                  scheduledTime={relatedVerification.scheduledTime}
                  status={relatedVerification.status}
                  selectable={false}
                  icon={relatedTaskData.icon}
                  credentialGroupId={relatedVerification.credentialGroupId}
                />
              );
            }
          } else {
            // here render task, not verification
            return (
              <Task
                task={task}
                status='default'
                userKey={user.key}
              />
            );
          }
        })}
    </Container>
  );
};

export default VerificationsList;
