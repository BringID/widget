import React, { FC, useState } from 'react'
import { TProps } from './types'
import { Value } from './styled-components'
import { TaskContainer, Icons } from '../'
import Button from '../button'
import { TModeConfigs, TTask, TVerification, TVerificationStatus } from '@/types'
import {
  runOAuthVerification,
  runZKTLSVerification,
  runInternalVerification,
  submitOAuthVerification,
  defineGroupForAuth,
} from '@/utils'
import { addVerification } from '@/app/content/store/reducers/verifications'
import { useDispatch } from 'react-redux'
import { useUser } from '@/app/content/store/reducers/user'
import { useConfigs } from '@/app/content/store/reducers/configs'
import { usePlausible } from 'next-plausible'
import { FarcasterOverlay, ZKPassportOverlay } from '@/app/content/components'

const defineTaskContent = (
  status: TVerificationStatus,
  loading: boolean,
  isActive: boolean,
  onClick: () => void,
) => {
  switch (status) {
    case 'default':
      return (
        <Button
          appearance="action"
          size="small"
          loading={loading}
          disabled={loading || isActive}
          onClick={onClick}
        >
          Verify
        </Button>
      )
    case 'pending':
    case 'scheduled':
      return <Icons.Clock />
    default:
      return <Icons.Check />
  }
}

const Task: FC<TProps> = ({
  status,
  task,
  onError,
  onMessage,
  setIsActive,
  isActive,
  autoVerifyingTaskId,
}) => {
  const dispatch = useDispatch()
  const user = useUser()
  const userConfigs = useConfigs()
  const plausible = usePlausible()

  const [loading, setLoading] = useState(false)
  const [showFarcasterOverlay, setShowFarcasterOverlay] = useState(false)
  const [showZKPassportOverlay, setShowZKPassportOverlay] = useState(false)

  const isAutoVerifying = autoVerifyingTaskId === task.id

  const baseParams = {
    task,
    userKey: user.key as string,
    appId: user.appId as string,
    modeConfigs: userConfigs.modeConfigs,
    mode: user.mode,
    plausible: (event: string, options?: { props?: Record<string, string> }) => plausible(event, options),
    setLoading,
    setIsActive,
    resultCallback: (verification: TVerification) => dispatch(addVerification(verification)),
    messageCallback: onMessage,
  }

  const handleClick = async () => {
    try {
      if (task.internal) {
        if (task.service === 'farcaster') {
          runInternalVerification(() => setShowFarcasterOverlay(true))
        } else {
          runInternalVerification(() => setShowZKPassportOverlay(true))
        }
        return
      }

      if (task.verificationType === 'zktls') {
        await runZKTLSVerification(baseParams)
      } else {
        await runOAuthVerification({
          ...baseParams,
          redirectUrl: user.redirectUrl,
          isMiniApp: user.isMiniApp,
        })
      }
    } catch (err) {
      setLoading(false)
      setIsActive(false)
      const errMessage = typeof err === 'string' ? err : (err as Error).message
      const isExpectedError = ['POPUP_BLOCKED', 'POPUP_CLOSED', 'VERIFICATION_TIMED_OUT'].some(
        (e) => errMessage?.includes(e)
      )
      if (!isExpectedError) plausible('verification_error')
      plausible('verification_failed', { props: { task_service: task.service } })
      onError(errMessage)
    }
  }

  const handleInternalComplete = async (
    hideOverlay: () => void,
    { message, signature }: { message: any; signature: string }
  ) => {
    hideOverlay()
    setLoading(true)
    setIsActive(true)
    try {
      const verification = await submitOAuthVerification(message, signature, baseParams)
      setLoading(false)
      setIsActive(false)
      dispatch(addVerification(verification))
    } catch (err) {
      setLoading(false)
      setIsActive(false)
      const errMessage = typeof err === 'string' ? err : (err as Error).message
      if (errMessage === 'NOT_ENOUGH_SCORE') {
        onMessage('NOT_ENOUGH_SCORE')
      } else {
        onError(errMessage)
      }
    }
  }

  const content = defineTaskContent(
    status,
    loading || isAutoVerifying,
    isActive,
    handleClick,
  )

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
      {showFarcasterOverlay && (
        <FarcasterOverlay
          task={task}
          isMiniApp={user.isMiniApp}
          onComplete={(data) => handleInternalComplete(() => setShowFarcasterOverlay(false), data)}
          onError={(err) => { setShowFarcasterOverlay(false); onError(err) }}
          onClose={() => setShowFarcasterOverlay(false)}
        />
      )}
      {showZKPassportOverlay && (
        <ZKPassportOverlay
          task={task}
          isMiniApp={user.isMiniApp}
          onComplete={(data) => handleInternalComplete(() => setShowZKPassportOverlay(false), data)}
          onError={(err) => { setShowZKPassportOverlay(false); onError(err) }}
          onClose={() => setShowZKPassportOverlay(false)}
        />
      )}
      <Value>{content}</Value>
    </TaskContainer>
  )
}

export default Task
