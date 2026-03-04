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
  defineGroupByZKTLSResult,
} from '@/utils'
import { taskManagerApi, verifierApi } from '@/app/content/api'
import { addVerification } from '@/app/content/store/reducers/verifications'
import { useDispatch } from 'react-redux'
import { useUser } from '@/app/content/store/reducers/user'
import { useConfigs } from '@/app/content/store/reducers/configs'
import { usePlausible } from 'next-plausible'

const defineTaskContent = (
  plausibleEvent: (
    eventName: string,
    options?: {
      props?: Record<string, string>
    }
  ) => void,
  status: TVerificationStatus,
  task: TTask,
  userKey: string | null,
  appId: string | null,
  loading: boolean,
  setLoading: (loading: boolean) => void,
  modeConfigs: TModeConfigs,
  mode: string,
  isActive: boolean,
  setIsActive: (
    active: boolean
  ) => void,
  redirectUrl: string | null,
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
              if (task.verificationType === 'oauth' || task.verificationType === 'auth') {
                const authUrl = task.verificationType === 'oauth'
                  ? `${configs.AUTH_DOMAIN}/${task.verificationUrl}`
                  : task.verificationUrl

                if (redirectUrl) {
                  setLoading(true)
                  setIsActive(true)
                  const finalUrl = `${authUrl}?redirect_url=${encodeURIComponent(redirectUrl)}`
                  window.postMessage(
                    { type: 'FARCASTER_OPEN_URL', payload: { url: finalUrl } },
                    window.location.origin
                  )
                  return
                }

                setLoading(true)
                setIsActive(true)
                plausibleEvent('oauth_verification_started', {
                  props: {
                    verification_started: task.service
                  }
                })
                plausibleEvent('verification_started', {
                  props: {
                    task_service: task.service
                  }
                })

                const {
                  message,
                  signature
                } = await getAuthSemaphoreData(
                  task,
                  plausibleEvent,
                  authUrl
                )

                const group = defineGroupForAuth(
                  task,
                  message.score
                )

                if (group) {

                  const semaphoreIdentity = createSemaphoreIdentity(userKey as string, appId as string, group.credentialGroupId)

                  const verify = await verifierApi.verifyOAuth(
                    configs.ZUPLO_API_URL,
                    message,
                    signature,
                    modeConfigs.REGISTRY,
                    Number(modeConfigs.CHAIN_ID),
                    group.credentialGroupId,
                    appId as string,
                    String(semaphoreIdentity.commitment),
                    mode
                  )

                  const {
                    signature: verifierSignature,
                    attestation: {
                      credential_id,
                      issued_at,
                      chain_id
                    }
                  } = verify

                  const { task: taskCreated, success } = await taskManagerApi.addVerification(
                    configs.ZUPLO_API_URL,
                    group.credentialGroupId,
                    credential_id,
                    issued_at,
                    chain_id,
                    appId as string,
                    String(semaphoreIdentity.commitment),
                    verifierSignature,
                    modeConfigs
                  )

                  console.log({ task: taskCreated, success  })

                  if (success) {
                    setLoading(false)
                    setIsActive(false)
                    plausibleEvent('oauth_verification_finished', {
                      props: {
                        verification_finished: task.service
                      }
                    })
                    plausibleEvent('verification_finished', {
                      props: {
                        task_service: task.service
                      }
                    })
                    resultCallback({
                      status: 'scheduled',
                      scheduledTime: taskCreated.scheduled_time + Number(configs.TASK_PENDING_TIME || 0),
                      taskId: taskCreated.id,
                      credentialGroupId: group?.credentialGroupId,
                      fetched: false,
                      score: group.score ?? 0,
                      chainId: chain_id,
                    })
                  }

                } else {
                  messageCallback('NOT_ENOUGH_SCORE')
                  return
                }


              } else {
                plausibleEvent('zktls_verification_started', {
                  props: {
                    verification_started: task.service,
                  }
                })
                plausibleEvent('verification_started', {
                  props: {
                    task_service: task.service
                  }
                })


                const bringIdInstalled = (window as any).bringID
                if (!bringIdInstalled) {
                  plausibleEvent('zktls_extension_not_installed')
                  messageCallback('EXTENSION_IS_NOT_INSTALLED')
                  return
                }

                setLoading(true)
                setIsActive(true)

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
                  const semaphoreIdentity = createSemaphoreIdentity(userKey as string, appId as string, groupData?.credentialGroupId)
                  const verify = await verifierApi.verify(
                    configs.ZUPLO_API_URL,
                    presentationData,
                    modeConfigs.REGISTRY,
                    Number(modeConfigs.CHAIN_ID),
                    credentialGroupId,
                    appId as string,
                    String(semaphoreIdentity.commitment),
                    mode
                  )

                  const {
                    signature: verifierSignature,
                    attestation: {
                      credential_id,
                      issued_at,
                      chain_id
                    }
                  } = verify

                  const { task: taskCreated, success } = await taskManagerApi.addVerification(
                    configs.ZUPLO_API_URL,
                    credentialGroupId,
                    credential_id,
                    issued_at,
                    chain_id,
                    appId as string,
                    String(semaphoreIdentity.commitment),
                    verifierSignature,
                    modeConfigs
                  )

                  if (success) {
                    setLoading(false)
                    setIsActive(false)
                    plausibleEvent('zktls_verification_finished', {
                      props: {
                        verification_finished: task.service
                      }
                    })
                    plausibleEvent('verification_finished', {
                      props: {
                        task_service: task.service
                      }
                    })
                    resultCallback({
                      status: 'scheduled',
                      scheduledTime: taskCreated.scheduled_time + Number(configs.TASK_PENDING_TIME || 0),
                      taskId: taskCreated.id,
                      credentialGroupId,
                      fetched: false,
                      score: task.groups.find(g => g.credentialGroupId === credentialGroupId)?.score ?? 0,
                      chainId: chain_id,
                    })
                  }

                } else {
                  messageCallback('NOT_ENOUGH_SCORE')
                  return
                }

              }

            } catch (err) {
              setLoading(false)
              setIsActive(false)
              const errMessage = typeof err === 'string' ? err : (err as Error).message
              const isExpectedError = [
                'POPUP_BLOCKED', 'POPUP_CLOSED',
                'VERIFICATION_TIMED_OUT',
              ].some(e => errMessage?.includes(e))
              if (!isExpectedError) {
                plausibleEvent('verification_error')
              }
              plausibleEvent('verification_failed', {
                props: {
                  task_service: task.service
                }
              })
              errorCallback(errMessage)
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
  task,
  onError,
  onMessage,
  setIsActive,
  isActive,
  autoVerifyingTaskId
}) => {

  const dispatch = useDispatch()
  const user = useUser()
  const userConfigs = useConfigs()

  const [ loading, setLoading ] = useState<boolean>(false)
  const isAutoVerifying = autoVerifyingTaskId === task.id
  const plausible = usePlausible()
  const content = defineTaskContent(
    (eventName, options) => plausible(eventName, options),
    status,
    task,
    user.key,
    user.appId,
    loading || isAutoVerifying,
    setLoading,
    userConfigs.modeConfigs,
    user.mode,
    isActive,
    setIsActive,
    user.redirectUrl,
    (verification) => {
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
      icon={task.icon}
      groups={task.groups}
    >
      <Value>{content}</Value>
    </TaskContainer>
  );
};

export default Task;
