'use client'
import { FC, useEffect, useRef, useState } from 'react'
import {
  Container,
  Content,
  HeaderStyled
} from './styled-components'
import { TProps } from './types'
import { Home, Proofs } from '../pages'
import { useDispatch } from 'react-redux'
import { setLoading, useModal, setMinPoints, setCustomTitles } from '../store/reducers/modal';
import { setAddress, setApiKey, setAppId, setKey, setMessage, setMode, setContract, setContext, setRedirectUrl, setIsFarcaster, useUser } from '../store/reducers/user';
import { TVerification, TVerificationStatus, TTask, TModeConfigs, TWidgetMessage, TOAuthMessage } from '@/types';
import { TProofSuccess } from '../api/indexer/types';
import semaphore from '../semaphore';
import { configs as remoteConfigs } from '../../core'
import configs from '../../configs'
import {
  addVerification,
  addVerifications,
  useVerifications
} from '../store/reducers/verifications';
import { LoadingOverlay, ErrorOverlay } from '../components'
import { addModeConfigs, addTasks, useConfigs } from '../store/reducers/configs'
import { usePlausible } from 'next-plausible'
import { getAppSemaphoreGroupId, getAllScores, createSemaphoreIdentity, defineGroupForAuth } from '@/utils'
import { taskManagerApi, verifierApi } from '../api'

const defineContent = (
  page: string,
  setPage: (page: string) => void,
  autoVerifyingTaskId: string | null,
) => {
  switch (page) {
    case 'home': return <Home
      setPage={setPage}
      autoVerifyingTaskId={autoVerifyingTaskId}
    />
    case 'proofs': return <Proofs
      onCancel={() => {
        window.postMessage({
          type: 'CLOSE_MODAL',
        }, window.location.origin)
      }}
      onConfirm={(proofs, pointsSelected) => {
        window.postMessage({
          type: 'PROOFS_RESPONSE',
          payload: {
            proofs,
            points: pointsSelected
          }
        }, window.location.origin)
      }}
      setPage={setPage}
    />

    default: return <Home setPage={setPage} />
  }
}

const uploadPrevVerifications = async (
  tasks: TTask[],
  userKey: string,
  appId: string,
  setLoading: (
    loading: boolean
  ) => void,
  modeConfigs: TModeConfigs,
  addVerifications: (verifications: TVerification[]) => void
) => {
  setLoading(true)

  // Collect all identity data for batch request
  const identityDataList: {
    identityCommitment: string,
    semaphoreGroupId: string,
    credentialGroupId: string,
    taskId: string
  }[] = []

  for (const task of tasks) {
    for (const group of task.groups) {
      try {
        const identity = semaphore.createIdentity(
          String(userKey),
          appId,
          group.credentialGroupId,
        )
        const { commitment } = identity;
        const semaphoreGroupId = await getAppSemaphoreGroupId(
          modeConfigs.REGISTRY,
          group.credentialGroupId,
          appId,
          modeConfigs.CHAIN_ID
        )
        identityDataList.push({
          identityCommitment: String(commitment),
          semaphoreGroupId,
          credentialGroupId: group.credentialGroupId,
          taskId: task.id
        })
      } catch (err) {
        console.error(`Failed to get semaphore group for ${group.credentialGroupId}:`, err)
      }
    }
  }

  const verifications: TVerification[] = []

  try {

    const proofs = await semaphore.getProofs(
      identityDataList.map(({ identityCommitment, semaphoreGroupId }) => ({
        identityCommitment,
        semaphoreGroupId
      })),
      modeConfigs
    )

    if (proofs) {
      for (const proofResult of proofs) {
        if (proofResult.success) {
          const matchingData = identityDataList.find(
            item => item.identityCommitment === proofResult.identity_commitment &&
                    item.semaphoreGroupId === proofResult.semaphore_group_id
          )

          if (matchingData) {
            const relatedGroup = tasks.flatMap(t => t.groups).find(
              g => g.credentialGroupId === matchingData.credentialGroupId
            )
            verifications.push({
              credentialGroupId: matchingData.credentialGroupId,
              status: 'completed' as TVerificationStatus,
              scheduledTime: +new Date(),
              fetched: true,
              taskId: matchingData.taskId,
              score: relatedGroup?.score ?? 0,
              chainId: Number(modeConfigs.CHAIN_ID),
              txHash: (proofResult as TProofSuccess).tx_hash ?? undefined,
            })
          }
        }
      }
    }
  } catch (err) {
    console.log('Failed to fetch proofs:', err);
  }

  addVerifications(verifications)

  setLoading(false)
}

const InnerContent: FC<TProps> = ({
  apiKey,
  address,
  parentUrl,
  customTitles,
}) => {

  const dispatch = useDispatch()

  const { loading } = useModal()
  const user = useUser()
  const { verifications } = useVerifications()
  const [ page, setPage ] = useState('home')
  const [ sessionLost, setSessionLost ] = useState(false)
  const [ invalidAppId, setInvalidAppId ] = useState(false)
  const userConfigs = useConfigs()
  const plausible = usePlausible()
  const userRef = useRef(user)
  userRef.current = user

  const [ pendingVerification, setPendingVerification ] = useState<{
    signature: string
    message: TOAuthMessage
  } | null>(null)
  const [ autoVerifyingTaskId, setAutoVerifyingTaskId ] = useState<string | null>(null)
  const [ autoVerifyError, setAutoVerifyError ] = useState<string | null>(null)
  const [ debugLogs, setDebugLogs ] = useState<string[]>([])
  const addLog = (msg: string) => setDebugLogs(prev => [...prev, msg])

  useEffect(() => {
    if (!parentUrl) {
      console.warn("No parent URL configured for iframe communication");
      return;
    }

    const parentOrigin = new URL(parentUrl).origin;

    const handler = async (event: MessageEvent<TWidgetMessage>) => {
      if (!event.data || typeof event.data !== 'object') {
        return;
      }

      const { type, payload } = event.data;


      if (typeof type !== 'string') {
        return;
      }

      // Handle messages from parent website
      if (event.origin === parentOrigin && event.source === window.parent) {
        if (type === 'USER_KEY_READY') {
          if (!payload?.signature) {
            console.warn('Invalid USER_KEY_READY payload');
            return;
          }
          if (!userRef.current.mode || !userRef.current.appId) {
            console.warn('Session lost: mode or appId missing. Please close and reopen the widget.');
            plausible('session_lost');
            setSessionLost(true);
            return;
          }
          plausible('generate_user_key_finished');
          dispatch(setLoading(true));
          dispatch(setKey(payload.signature));
          addLog(`[USER_KEY_READY] isFarcaster: ${userRef.current.isFarcaster}, address: ${userRef.current.address}`)
          if (userRef.current.isFarcaster && userRef.current.address) {
            localStorage.setItem(`bringid_key_${userRef.current.address}`, payload.signature)
            addLog('[USER_KEY_READY] key saved to localStorage')
          }
          return;
        }
        
        if (type === 'PROOFS_REQUEST') {
          plausible('verify_humanity_request_started');

          const newMode = payload?.mode || 'production'
          const newAppId = payload?.appId || null

          if (newMode !== userRef.current.mode || newAppId !== userRef.current.appId) {
            dispatch(setKey(null))
            dispatch(addVerifications([]))
            setInvalidAppId(false)
          }

          dispatch(setMode(newMode));
          dispatch(setAppId(newAppId));
          dispatch(setContract(payload?.contract || null));
          dispatch(setContext(payload?.context ?? 0));
          dispatch(setMessage(payload?.message || null));
          dispatch(setMinPoints(payload?.minPoints || 0));
          dispatch(setRedirectUrl(payload?.redirectUrl ? decodeURIComponent(payload.redirectUrl) : null));
          dispatch(setIsFarcaster(payload?.isFarcaster ?? false));

          addLog(`[PROOFS_REQUEST] verificationSignature: ${payload?.verificationSignature ?? 'none'}`)
          addLog(`[PROOFS_REQUEST] verificationMessage: ${payload?.verificationMessage ?? 'none'}`)

          if (payload?.verificationSignature && payload?.verificationMessage) {
            try {
              const sig = decodeURIComponent(payload.verificationSignature)
              const msg = JSON.parse(decodeURIComponent(payload.verificationMessage)) as TOAuthMessage
              addLog(`[PROOFS_REQUEST] parsed message domain: ${msg.domain}, score: ${msg.score}`)
              setPendingVerification({ signature: sig, message: msg })
            } catch (e) {
              addLog(`[PROOFS_REQUEST] failed to parse: ${e}`)
              console.error('[PROOFS_REQUEST] Failed to parse verification data:', e)
            }
          }

          console.log('[PROOFS_REQUEST] dispatched:', {
            mode: newMode,
            appId: newAppId,
            contract: payload?.contract || null,
            context: payload?.context ?? 0,
            message: payload?.message || null,
            minPoints: payload?.minPoints || 0,
          });
          return;
        }

        console.warn('Unknown message type from parent:', type);
        return;
      }

      if (event.source === window && event.origin === window.location.origin) {
        if (type === 'GENERATE_USER_KEY') {
          plausible('generate_user_key_started');
          window.parent.postMessage(
            { type: "GENERATE_USER_KEY", payload },
            parentOrigin
          );
          return;
        }

        if (type === 'PROOFS_RESPONSE') {
          setPage('home');
          plausible('verify_humanity_request_finished');
          window.parent.postMessage(
            { type: "PROOFS_RESPONSE", payload },
            parentOrigin
          );
          return;
        }

        if (type === 'CLOSE_MODAL') {
          setPage('home');
          plausible('close_modal');
          window.parent.postMessage(
            { type: "CLOSE_MODAL" },
            parentOrigin
          );
          return;
        }

        if (type === 'FARCASTER_OPEN_URL') {
          window.parent.postMessage(
            { type: 'FARCASTER_OPEN_URL', payload },
            parentOrigin
          );
          return;
        }

        return; // Ignore other self-messages
      }


      console.warn("Blocked message from untrusted source:", {
        origin: event.origin,
        expectedOrigin: parentOrigin,
        type
      });
    }
    window.addEventListener("message", handler);

    return () => {
      window.removeEventListener("message", handler);
    }
  }, [
    parentUrl
  ])


  useEffect(() => {
    if (!verifications) { return }

    const interval = setInterval(async () => {
      try {
        const notCompletedVerifications = verifications.filter(
          (verification) => verification.status !== 'completed',
        );
        if (notCompletedVerifications.length === 0) {
          return;
        }

        let updated = false

        const verificationsUpdated = verifications.map(item => {
          if (item.status !== 'completed') {
            const now = +new Date();
            const expiration = item.scheduledTime - now;
            if (expiration <= 0) {
              updated = true
              return {
                ...item,
                status: 'completed' as TVerificationStatus
              }
            }
          }
          return item
        })
    
        if (updated) dispatch(addVerifications(verificationsUpdated))

      } catch (err) {
        console.error({ err });
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [
    verifications
  ]);

  useEffect(() => {
    if (address) {
      if (user.address) {
        if (address !== user.address) {
          dispatch(setKey(null))
          dispatch(addVerifications([]))
        }
      }
      dispatch(setAddress(address))
    } else {
      if (user.address) {
        dispatch(setKey(null))
        dispatch(addVerifications([]))
        dispatch(setAddress(null))
      }
    }

    if (apiKey) {
      dispatch(setApiKey(apiKey));
    }

  }, [
    user.address,
    apiKey,
    address,
  ]);

  useEffect(() => {
    if (!address) return
    if (!user.isFarcaster) return
    addLog(`[localStorage] isFarcaster: true, checking for stored key, address: ${address}`)
    const storedKey = localStorage.getItem(`bringid_key_${address}`)
    addLog(`[localStorage] storedKey found: ${!!storedKey}`)
    if (storedKey) {
      if (!userRef.current.key) {
        dispatch(setLoading(true))
        dispatch(setKey(storedKey))
      }
    } else {
      const staleKeys = Object.keys(localStorage).filter(k => k.startsWith('bringid_key_'))
      if (staleKeys.length > 0) {
        addLog(`[localStorage] no key for current address, clearing ${staleKeys.length} stale entry(s)`)
        staleKeys.forEach(k => localStorage.removeItem(k))
      }
    }
  }, [address, user.isFarcaster]);

  useEffect(() => {
    if (customTitles) {
      dispatch(setCustomTitles(customTitles))
    }
  }, [customTitles])

  useEffect(() => {
    addLog(`[auto-verify] pending: ${!!pendingVerification}, key: ${!!user.key}, appId: ${user.appId}, tasks: ${userConfigs.tasks.length}, registry: ${!!userConfigs.modeConfigs.REGISTRY}`)
    if (!pendingVerification) return
    if (!user.key) return
    if (!user.appId) return
    if (userConfigs.tasks.length === 0) return
    if (!userConfigs.modeConfigs.REGISTRY) return

    const { signature, message } = pendingVerification

    addLog(`[auto-verify] looking for task with domain: ${message.domain}`)
    addLog(`[auto-verify] available domains: ${userConfigs.tasks.map(t => t.domain ?? 'none').join(', ')}`)
    const matchingTask = userConfigs.tasks.find(task => task.domain === message.domain)
    addLog(`[auto-verify] matchingTask: ${matchingTask?.id ?? 'not found'}`)
    if (!matchingTask) return

    const alreadyVerified = verifications.some(
      v => v.taskId === matchingTask.id && v.status === 'completed'
    )
    if (alreadyVerified) {
      setPendingVerification(null)
      dispatch(setRedirectUrl(null))
      dispatch(setIsFarcaster(false))
      return
    }

    setAutoVerifyingTaskId(matchingTask.id)

    const processVerification = async () => {
      const group = defineGroupForAuth(matchingTask, message.score)
      if (!group) return

      const semaphoreIdentity = createSemaphoreIdentity(user.key!, user.appId!, group.credentialGroupId)

      const verify = await verifierApi.verifyOAuth(
        configs.ZUPLO_API_URL,
        message,
        signature,
        userConfigs.modeConfigs.REGISTRY,
        Number(userConfigs.modeConfigs.CHAIN_ID),
        group.credentialGroupId,
        user.appId!,
        String(semaphoreIdentity.commitment),
        user.mode
      )

      const {
        signature: verifierSignature,
        attestation: { credential_id, issued_at, chain_id }
      } = verify

      const { task: taskCreated, success } = await taskManagerApi.addVerification(
        configs.ZUPLO_API_URL,
        group.credentialGroupId,
        credential_id,
        issued_at,
        chain_id,
        user.appId!,
        String(semaphoreIdentity.commitment),
        verifierSignature,
        userConfigs.modeConfigs
      )

      if (success) {
        dispatch(addVerification({
          status: 'scheduled',
          scheduledTime: taskCreated.scheduled_time + Number(configs.TASK_PENDING_TIME || 0),
          taskId: taskCreated.id,
          credentialGroupId: group.credentialGroupId,
          fetched: false,
          score: group.score ?? 0,
          chainId: chain_id,
        }))
      }

      setAutoVerifyingTaskId(null)
      setPendingVerification(null)
      dispatch(setRedirectUrl(null))
      dispatch(setIsFarcaster(false))
    }

    processVerification().catch(err => {
      console.error('[auto-verify] Failed:', err)
      const msg = typeof err === 'string' ? err : (err as Error).message
      setAutoVerifyError(msg)
      setAutoVerifyingTaskId(null)
      setPendingVerification(null)
      dispatch(setRedirectUrl(null))
      dispatch(setIsFarcaster(false))
    })
  }, [pendingVerification, user.key, user.appId, userConfigs.tasks, userConfigs.modeConfigs, verifications])

  useEffect(() => {

    if (!user.address) return
    if (!user.mode) return
    if (!user.appId) return

    const init = async () => {
      const userConfigs = await remoteConfigs(user.mode === 'dev')
      dispatch(addModeConfigs(userConfigs.configs))

      try {
        const scoresMap = await getAllScores(
          userConfigs.configs.REGISTRY,
          user.appId as string,
          userConfigs.configs.CHAIN_ID
        )
        if (scoresMap === null) {
          setInvalidAppId(true)
          dispatch(addTasks([]))
          dispatch(setLoading(false))
          return
        }
        const enrichedTasks = userConfigs.tasks.map(task => ({
          ...task,
          groups: task.groups.map(group => ({
            ...group,
            score: scoresMap.get(group.credentialGroupId) ?? 0
          }))
        })).filter(task => task.groups.some(group => group.score > 0))
        dispatch(addTasks(enrichedTasks))
      } catch (err) {
        console.error('Failed to fetch scores:', err)
        dispatch(addTasks(userConfigs.tasks))
      }
    }
    init().catch(err => {
      console.error('Failed to load configs:', err)
      dispatch(setLoading(false))
    })
  }, [
    user.address,
    user.mode,
    user.appId
  ])

  useEffect(() => {
    if (!user.key) return
    if (!user.appId) return
    console.log({
      userConfigs
    })
    if (userConfigs.tasks.length === 0) {
      dispatch(setLoading(false))
      return
    }
    if (!userConfigs.modeConfigs.REGISTRY) {
      dispatch(setLoading(false))
      return
    }

    uploadPrevVerifications(
      userConfigs.tasks,
      user.key,
      user.appId,
      (loading: boolean) => dispatch(setLoading(loading)),
      userConfigs.modeConfigs,
      (verifications) => {
        console.log('HERE uploading verifications')
        dispatch(addVerifications(verifications))
      }
    ).catch(err => {
      console.error('Failed to upload previous verifications:', err)
      dispatch(setLoading(false))
    })
  }, [
    userConfigs,
    user.key,
    user.appId
  ]);


  return <Container>
    <HeaderStyled
      address={user.address}
      userKey={user.key}
    />
    {loading && !sessionLost && !invalidAppId && <LoadingOverlay title="Thinking..."/>}
    {sessionLost && <ErrorOverlay
      errorText="SESSION_LOST"
      buttonTitle='Close'
      onClose={() => {
        setSessionLost(false)
        window.postMessage({
          type: 'CLOSE_MODAL',
        }, window.location.origin)
      }}
    />}
    {invalidAppId && <ErrorOverlay
      errorText="INVALID_APP_ID"
      buttonTitle='Close'
      onClose={() => {
        setInvalidAppId(false)
        dispatch(setAppId(null))
        dispatch(setMode(''))
        window.postMessage({
          type: 'CLOSE_MODAL',
        }, window.location.origin)
      }}
    />}
    {autoVerifyError && <ErrorOverlay
      errorText={autoVerifyError}
      onClose={() => setAutoVerifyError(null)}
    />}
    {(debugLogs.length > 0 || true) && (
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        background: 'rgba(0,0,0,0.85)',
        color: '#0f0',
        fontSize: '8px',
        fontFamily: 'monospace',
        padding: '6px',
        zIndex: 9999,
        maxHeight: '50px',
        overflowY: 'auto',
      }}>
        <div>isFarcaster: {String(user.isFarcaster)}</div>
        <div>redirectUrl: {user.redirectUrl ?? 'null'}</div>
        <div>hasKey: {String(!!user.key)}</div>
        {debugLogs.map((log, i) => <div key={i}>{log}</div>)}
      </div>
    )}
    <Content>
      {defineContent(
        page,
        setPage,
        autoVerifyingTaskId,
      )}
    </Content>
  </Container>
}

export default InnerContent