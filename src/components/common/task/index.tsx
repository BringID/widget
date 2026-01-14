import React, { FC, useState } from 'react'
import { TProps } from './types'
import { Value } from './styled-components'
import { TaskContainer, Icons, Tag } from '../'
import Button from '../button'
import configs from '@/app/configs'
import { TModeConfigs, TTask, TVerification, TVerificationStatus } from '@/types'
import {
  createSemaphoreIdentity,
  getOAuthSemaphoreData,
  getZKTLSSemaphoreData
} from '@/utils'
import { taskManagerApi } from '@/app/content/api'
import { addVerification } from '@/app/content/store/reducers/verifications'
import { useDispatch } from 'react-redux'
import { useUser } from '@/app/content/store/reducers/user'
import { useConfigs } from '@/app/content/store/reducers/configs'

const defineTaskContent = (
  status: TVerificationStatus,
  task: TTask,
  userKey: string | null,
  loading: boolean,
  setLoading: (loading: boolean) => void,
  modeConfigs: TModeConfigs,
  mode: string,
  resultCallback: (verification: TVerification) => void
) => {
  switch (status) {
    case 'default':
      return (
        <Button
          appearance="action"
          size="small"
          loading={loading}
          onClick={async () => {
            try {
              const group = task?.groups[0]


              if (group) {

                const semaphoreIdentity = createSemaphoreIdentity(userKey as string, group?.credentialGroupId)
                setLoading(true)
                const {
                  signature,
                  verifier_hash,
                  verifier_message: {
                    id_hash
                  }
                } = task.oauthUrl ? await getOAuthSemaphoreData(
                  task,
                  group,
                  semaphoreIdentity,
                  modeConfigs.REGISTRY,
                  mode
                ) : await getZKTLSSemaphoreData(
                  task,
                  userKey as string,
                  modeConfigs.REGISTRY,
                  mode
                )

                console.log('WIDGET data received: ', {
                  signature,
                  verifier_hash,
                  verifier_message: {
                    id_hash
                  }
                })

                const { task: taskCreated, success } = await taskManagerApi.addVerification(
                  configs.ZUPLO_API_URL,
                  group?.credentialGroupId,
                  id_hash,
                  String(semaphoreIdentity.commitment),
                  signature,
                  modeConfigs
                )

                if (success) {
                  setLoading(false)
                  resultCallback({
                    status: 'scheduled',
                    scheduledTime: taskCreated.scheduled_time,
                    taskId: taskCreated.id,
                    credentialGroupId: group?.credentialGroupId,
                    fetched: false
                  })
                }

                console.log({ taskCreated })
              
              }
            } catch (err) {
              setLoading(false)
              console.log({ err })
              alert(err)
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
  task
}) => {

  const dispatch = useDispatch()
  const user = useUser()
  const userConfigs = useConfigs()

  const [ loading, setLoading ] = useState<boolean>(false)

  const content = defineTaskContent(
    status,
    task,
    userKey,
    loading,
    setLoading,
    userConfigs.modeConfigs,
    user.mode,
    (verification) => {
      console.log('IS GOINT TO BE ADD: ', { verification })
      dispatch(addVerification(verification))
    }
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
