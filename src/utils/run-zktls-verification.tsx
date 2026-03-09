import { TModeConfigs, TTask, TVerification } from '@/types'
import configs from '@/app/configs'
import { createSemaphoreIdentity, defineGroupByZKTLSResult, getZKTLSSemaphoreData } from '@/utils'
import { taskManagerApi, verifierApi } from '@/app/content/api'

type TRunZKTLSVerificationParams = {
  task: TTask
  userKey: string
  appId: string
  modeConfigs: TModeConfigs
  mode: string
  plausible: (event: string, options?: { props?: Record<string, string> }) => void
  setLoading: (loading: boolean) => void
  setIsActive: (active: boolean) => void
  resultCallback: (verification: TVerification) => void
  messageCallback: (message: string, copyText?: string) => void
}

const runZKTLSVerification = async (params: TRunZKTLSVerificationParams): Promise<void> => {
  const {
    task, userKey, appId, modeConfigs, mode, plausible,
    setLoading, setIsActive, resultCallback, messageCallback,
  } = params

  plausible('zktls_verification_started', { props: { verification_started: task.service } })
  plausible('verification_started', { props: { task_service: task.service } })

  const bringIdInstalled = (window as any).bringID
  if (!bringIdInstalled) {
    plausible('zktls_extension_not_installed')
    messageCallback('EXTENSION_IS_NOT_INSTALLED')
    return
  }

  setLoading(true)
  setIsActive(true)

  const { presentationData, transcriptRecv } = await getZKTLSSemaphoreData(task, plausible)

  const groupData = defineGroupByZKTLSResult(transcriptRecv as string, task.groups)
  if (!groupData) {
    setLoading(false)
    setIsActive(false)
    messageCallback('NOT_ENOUGH_SCORE')
    return
  }

  const { credentialGroupId } = groupData
  const semaphoreIdentity = createSemaphoreIdentity(userKey, appId, credentialGroupId)

  const verify = await verifierApi.verify(
    configs.ZUPLO_API_URL,
    presentationData,
    modeConfigs.REGISTRY,
    Number(modeConfigs.CHAIN_ID),
    credentialGroupId,
    appId,
    String(semaphoreIdentity.commitment),
    mode
  )

  const { signature: verifierSignature, attestation: { credential_id, issued_at, chain_id } } = verify

  const { task: taskCreated, success } = await taskManagerApi.addVerification(
    configs.ZUPLO_API_URL,
    credentialGroupId,
    credential_id,
    issued_at,
    chain_id,
    appId,
    String(semaphoreIdentity.commitment),
    verifierSignature,
    modeConfigs
  )

  if (success) {
    setLoading(false)
    setIsActive(false)
    plausible('zktls_verification_finished', { props: { verification_finished: task.service } })
    plausible('verification_finished', { props: { task_service: task.service } })
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
}

export default runZKTLSVerification
