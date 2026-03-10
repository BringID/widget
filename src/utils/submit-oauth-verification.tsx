import { TModeConfigs, TTask, TVerification } from '@/types'
import TOAuthMessage from '@/types/oauth-message'
import configs from '@/app/configs'
import { createSemaphoreIdentity, defineGroupForAuth } from '@/utils'
import { taskManagerApi, verifierApi } from '@/app/content/api'

type TSubmitOAuthVerificationParams = {
  task: TTask
  userKey: string
  appId: string
  modeConfigs: TModeConfigs
  mode: string
  plausible: (event: string, options?: { props?: Record<string, string> }) => void
}

const submitOAuthVerification = async (
  message: TOAuthMessage,
  signature: string,
  params: TSubmitOAuthVerificationParams
): Promise<TVerification> => {
  const { task, userKey, appId, modeConfigs, mode, plausible } = params

  const group = defineGroupForAuth(task, message.score)
  if (!group) throw new Error('NOT_ENOUGH_SCORE')

  const semaphoreIdentity = createSemaphoreIdentity(userKey, appId, group.credentialGroupId)

  const verify = await verifierApi.verifyOAuth(
    configs.ZUPLO_API_URL,
    message,
    signature,
    modeConfigs.REGISTRY,
    Number(modeConfigs.CHAIN_ID),
    group.credentialGroupId,
    appId,
    String(semaphoreIdentity.commitment),
    mode
  )

  const { signature: verifierSignature, attestation: { credential_id, issued_at, chain_id } } = verify

  const { task: taskCreated, success } = await taskManagerApi.addVerification(
    configs.ZUPLO_API_URL,
    group.credentialGroupId,
    credential_id,
    issued_at,
    chain_id,
    appId,
    String(semaphoreIdentity.commitment),
    verifierSignature,
    modeConfigs
  )

  if (!success) throw new Error('TASK_CREATION_FAILED')

  plausible('oauth_verification_finished', { props: { verification_finished: task.service } })
  plausible('verification_finished', { props: { task_service: task.service } })

  return {
    status: 'scheduled',
    scheduledTime: taskCreated.scheduled_time + Number(configs.TASK_PENDING_TIME || 0),
    taskId: taskCreated.id,
    credentialGroupId: group.credentialGroupId,
    fetched: false,
    score: group.score ?? 0,
    chainId: chain_id,
  }
}

export default submitOAuthVerification
