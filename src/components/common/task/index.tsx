import React, { FC, useState } from 'react'
import { TProps } from './types'
import { Value } from './styled-components'
import { TaskContainer, Icons } from '../'
import Button from '../button'
import { TModeConfigs, TTask, TVerification, TVerificationStatus } from '@/types'
import {
  runOAuthVerification,
  runZKTLSVerification,
  submitOAuthVerification,
  defineGroupForAuth,
  isMobileDevice,
} from '@/utils'
import { addVerification } from '@/app/content/store/reducers/verifications'
import { useDispatch } from 'react-redux'
import { useUser } from '@/app/content/store/reducers/user'
import { useConfigs } from '@/app/content/store/reducers/configs'
import { usePlausible } from 'next-plausible'
import { FarcasterOverlay, ZKPassportOverlay, SelfOverlay } from '@/app/content/components'

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
  const [showSelfOverlay, setShowSelfOverlay] = useState(false)

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

  const service = task.service?.toLowerCase()
  const isRedirectAuthService = service === 'zkpassport' || service === 'self'

  const handleClick = async () => {
    try {
      // zktls — blocked on mobile and miniapp (requires desktop extension)
      if (task.verificationType === 'zktls') {
        if (isMobileDevice() || user.isMiniApp) {
          onMessage('ZKTLS_MOBILE_NOT_SUPPORTED')
          return
        }
        await runZKTLSVerification(baseParams)
        return
      }

      if (user.isMiniApp) {
        // oauth and redirect-based auth (zkpassport, self) require a redirectUrl in miniapp
        if (task.verificationType === 'oauth' || (task.verificationType === 'auth' && isRedirectAuthService)) {
          if (!user.redirectUrl) {
            onMessage('MISSING_REDIRECT_URL')
            return
          }
          await runOAuthVerification({
            ...baseParams,
            redirectUrl: user.redirectUrl,
            isMiniApp: true,
          })
          return
        }

        // auth with messageSignerUrl (e.g. farcaster) — show overlay
        if (service === 'farcaster') {
          setShowFarcasterOverlay(true)
        }
        return
      }

      // not miniapp
      if (task.verificationType === 'oauth') {
        await runOAuthVerification({
          ...baseParams,
          redirectUrl: null,
          isMiniApp: false,
        })
        return
      }

      // auth — show the appropriate overlay
      if (service === 'farcaster') {
        setShowFarcasterOverlay(true)
      } else if (service === 'self') {
        setShowSelfOverlay(true)
      } else {
        setShowZKPassportOverlay(true)
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
    { message, signature }: { message: { domain: string; user_id: string; score: number; timestamp: number }; signature: string }
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
      {showSelfOverlay && (
        <SelfOverlay
          task={task}
          isMiniApp={user.isMiniApp}
          onComplete={(data) => handleInternalComplete(() => setShowSelfOverlay(false), data)}
          onError={(err) => { setShowSelfOverlay(false); onError(err) }}
          onClose={() => setShowSelfOverlay(false)}
        />
      )}
      <Value>{content}</Value>
    </TaskContainer>
  )
}

export default Task
