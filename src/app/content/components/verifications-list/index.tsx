import { FC, useState } from 'react';

import {
  Container,
  NoteStyled,
  LinkStyled,
} from './styled-components';
import ErrorOverlay from '../error-overlay';
import { Task, Verification } from '@/components/common';
import TProps from './types';
import { defineRelatedVerification, defineTaskByCredentialGroupId } from '@/utils';
import { useUser } from '../../store/reducers/user';
import { useConfigs } from '../../store/reducers/configs';
import MessageOverlay from '../message-overlay';

const VerificationsList: FC<TProps> = ({
  verifications,
  className,
  autoVerifyingTaskId,
}) => {

  const userConfigs = useConfigs()

  const user = useUser()
  const hasAnyPendingVerification = verifications.find(
    (verification) =>
      verification.status === 'scheduled' || verification.status === 'pending',
  );

  const [ error, setError ] = useState<string | null>(null)
  const [ message, setMessage ] = useState<string | null>(null)
  const [ copyText, setCopyText ] = useState<string | undefined>(undefined)
  const [ isActive, setIsActive ] = useState<boolean>(false)

  const effectiveIsActive = isActive || !!autoVerifyingTaskId

  return (
    <Container className={className}>

      {error && <ErrorOverlay
        errorText={error}
        onClose={() => {
          setError(null)
        }}
      />}

      {message && <MessageOverlay
        message={message}
        copyText={copyText}
        onClose={() => {
          setMessage(null)
          setCopyText(undefined)
        }}
      />}

      {/* {hasAnyPendingVerification && (
        <NoteStyled>
          We batch verifications for better privacy.{' '}
          <LinkStyled href="https://bringid.org/privacy-policy" target="_blank">
            Learn more
          </LinkStyled>
        </NoteStyled>
      )} */}
      {/* {verifications.length === 0 && (
        <NoVerificationsFound title="No verifications yet" />
      )} */}
      {
        userConfigs.tasks.map((task) => {
          const relatedVerification = defineRelatedVerification(
            task,
            verifications
          )

          if (relatedVerification) {
             const relatedTaskData = defineTaskByCredentialGroupId(
              relatedVerification.credentialGroupId,
              userConfigs.tasks
            )

            if (relatedTaskData) {
              return (
                <Verification
                  fetched={relatedVerification.fetched}
                  key={relatedVerification.taskId}
                  title={task.title}
                  description={task.description}
                  taskId={relatedVerification.taskId}
                  points={relatedVerification.score}
                  scheduledTime={relatedVerification.scheduledTime}
                  status={relatedVerification.status}
                  selectable={false}
                  icon={relatedTaskData.icon}
                  credentialGroupId={relatedVerification.credentialGroupId}
                  txHash={relatedVerification.txHash}
                />
              );
            }
          } else {
            // here render task, not verification
            return (
              <Task
                onMessage={(message, copyText) => {
                  setMessage(message)
                  setCopyText(copyText)
                }}
                task={task}
                status='default'
                setIsActive={setIsActive}
                isActive={effectiveIsActive}
                autoVerifyingTaskId={autoVerifyingTaskId}
                onError={(errorText => {
                  setError(errorText)
                })}
              />
            );
          }
        })}
    </Container>
  );
};

export default VerificationsList;
