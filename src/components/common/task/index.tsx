import React, { FC, useState } from 'react'
import { TProps } from './types'
import { Value } from './styled-components'
import { TaskContainer, Icons, Tag } from '../'
import Button from '../button'
import configs from '@/app/configs'
import { TModeConfigs, TTask, TVerification, TVerificationStatus } from '@/types'
import {
  createSemaphoreIdentity,
  defineGroupForAuth,
  getAuthSemaphoreData,
  getZKTLSSemaphoreData,
  defineGroupByZKTLSResult
} from '@/utils'
import { taskManagerApi, verifierApi } from '@/app/content/api'
import { addVerification } from '@/app/content/store/reducers/verifications'
import { useDispatch } from 'react-redux'
import { useUser } from '@/app/content/store/reducers/user'
import { useConfigs } from '@/app/content/store/reducers/configs'
import { usePlausible } from 'next-plausible'

const defineTaskContent = (
  plausibleEvent: (eventName: string) => void,
  status: TVerificationStatus,
  task: TTask,
  userKey: string | null,
  loading: boolean,
  setLoading: (loading: boolean) => void,
  modeConfigs: TModeConfigs,
  mode: string,
  isActive: boolean,
  setIsActive: (
    active: boolean
  ) => void,
  resultCallback: (verification: TVerification) => void,
  errorCallback: (errorText: string) => void,
  messageCallback: (message: string) => void
) => {
  switch (status) {
    case 'default':
      return (
        <Button
          appearance="action"
          size="small"
          loading={loading}
          disabled={loading || isActive}
          onClick={async () => {
            try {
              setLoading(true)
              setIsActive(true)

              if (task.verificationType === 'oauth' || task.verificationType === 'auth') {

                plausibleEvent('oauth_verification_started')

                const {
                  message,
                  signature
                } = await getAuthSemaphoreData(
                  task.verificationType,
                  task.verificationUrl,
                  plausibleEvent
                )

                const group = defineGroupForAuth(
                  task,
                  message.score
                )

                console.log({
                  message,
                  signature,
                  group
                })
                

                if (group) {

                  const semaphoreIdentity = createSemaphoreIdentity(userKey as string, group.credentialGroupId)

                  const verify = await verifierApi.verifyOAuth(
                    configs.ZUPLO_API_URL,
                    message,
                    signature,
                    modeConfigs.REGISTRY,
                    group.credentialGroupId,
                    String(semaphoreIdentity.commitment),
                    mode
                  )

                  const {
                    signature: verifierSignature,
                    verifier_message: {
                      id_hash
                    }
                  } = verify

                  const { task: taskCreated, success } = await taskManagerApi.addVerification(
                    configs.ZUPLO_API_URL,
                    group.credentialGroupId,
                    id_hash,
                    String(semaphoreIdentity.commitment),
                    verifierSignature,
                    modeConfigs
                  )

                  console.log({ task: taskCreated, success  })

                  if (success) {
                    setLoading(false)
                    setIsActive(false)
                    plausibleEvent('oauth_verification_finished')
                    resultCallback({
                      status: 'scheduled',
                      scheduledTime: taskCreated.scheduled_time + Number(configs.TASK_PENDING_TIME || 0),
                      taskId: taskCreated.id,
                      credentialGroupId: group?.credentialGroupId,
                      fetched: false
                    })
                  }

                  console.log({ taskCreated })
                } else {
                  messageCallback('NOT_ENOUGH_SCORE')
                  return 
                }


              } else {
                plausibleEvent('zktls_verification_started')


                const bringIdInstalled = (window as any).bringID
                if (!bringIdInstalled) {
                  messageCallback('EXTENSION_IS_NOT_INSTALLED')
                  return
                }

                const {
                  presentationData,
                  transcriptRecv
                } = await getZKTLSSemaphoreData(
                  task,
                  plausibleEvent
                )

              
                const groupData = defineGroupByZKTLSResult(
                  transcriptRecv as string,
                  task.groups
                )

                if (groupData) {
                  const { credentialGroupId } = groupData
                  const semaphoreIdentity = createSemaphoreIdentity(userKey as string, groupData?.credentialGroupId)
                  const verify = await verifierApi.verify(
                    configs.ZUPLO_API_URL,
                    presentationData,
                    modeConfigs.REGISTRY,
                    credentialGroupId,
                    String(semaphoreIdentity.commitment),
                    mode
                  )

                  const {
                    signature,
                    verifier_message: {
                      id_hash
                    }
                  } = verify

                  const { task: taskCreated, success } = await taskManagerApi.addVerification(
                    configs.ZUPLO_API_URL,
                    credentialGroupId,
                    id_hash,
                    String(semaphoreIdentity.commitment),
                    signature,
                    modeConfigs
                  )

                  if (success) {
                    setLoading(false)
                    setIsActive(false)
                    plausibleEvent('zktls_verification_finished')
                    resultCallback({
                      status: 'scheduled',
                      scheduledTime: taskCreated.scheduled_time + Number(configs.TASK_PENDING_TIME || 0),
                      taskId: taskCreated.id,
                      credentialGroupId,
                      fetched: false
                    })
                  }

                  console.log({ taskCreated })
                
                } else {
                  messageCallback('NOT_ENOUGH_SCORE')
                  return
                }

              }

            } catch (err) {
              setLoading(false)
              setIsActive(false)
              console.log({ err })
              if (typeof err === 'string') {
                errorCallback(err)
              } else{
                errorCallback((err as Error).message)
              }
            }
          }}
        >
          Verify
        </Button>
      );
    case 'pending':
    case 'scheduled':
      return <Icons.Clock />;

    default:
      return <Icons.Check />;
  }
};

const Task: FC<TProps> = ({
  status,
  userKey,
  task,
  onError,
  onMessage,
  setIsActive,
  isActive
}) => {

  const dispatch = useDispatch()
  const user = useUser()
  const userConfigs = useConfigs()

  const [ loading, setLoading ] = useState<boolean>(false)
  const plausible = usePlausible()
  const content = defineTaskContent(
    (eventName) => plausible(eventName),
    status,
    task,
    userKey,
    loading,
    setLoading,
    userConfigs.modeConfigs,
    user.mode,
    isActive,
    setIsActive,
    (verification) => {
      console.log('IS GOINT TO BE ADD: ', { verification })
      dispatch(addVerification(verification))
    },
    onError,
    onMessage
  );

  return (
    <TaskContainer
      status={status}
      selectable={false}
      title={task.title}
      description={task.description}
      id={task.id}
      groups={task.groups}
      icon={task.icon}
    >
      <Value>{content}</Value>
    </TaskContainer>
  );
};

export default Task;
