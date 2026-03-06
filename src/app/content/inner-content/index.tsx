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
import { setAddress, setApiKey, setAppId, setKey, setMessage, setMode, setContract, setContext, setRedirectUrl, setIsMiniApp, useUser } from '../store/reducers/user';
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

type ConfigsPhase = 'idle' | 'loading' | 'done'
type FlowPhase = 'idle' | 'loading' | 'ready'

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

const fetchPrevVerifications = async (
  tasks: TTask[],
  userKey: string,
  appId: string,
  modeConfigs: TModeConfigs,
): Promise<TVerification[]> => {
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

  return verifications
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
  const userConfigs = useConfigs()
  const plausible = usePlausible()

  const [ page, setPage ] = useState('home')
  const [ sessionLost, setSessionLost ] = useState(false)
  const [ invalidAppId, setInvalidAppId ] = useState(false)

  const [ pendingVerification, setPendingVerification ] = useState<{
    signature: string
    message: TOAuthMessage
  } | null>(null)
  const pendingVerificationRef = useRef(pendingVerification)
  pendingVerificationRef.current = pendingVerification

  const [ autoVerifyingTaskId, setAutoVerifyingTaskId ] = useState<string | null>(null)
  const [ autoVerifyError, setAutoVerifyError ] = useState<string | null>(null)

  // Phase tracking for the sequential flow
  const [ configsPhase, setConfigsPhase ] = useState<ConfigsPhase>('idle')
  const [ flowPhase, setFlowPhase ] = useState<FlowPhase>('idle')

  // Cancellation counters — incrementing invalidates any in-flight async run
  const configsRunIdRef = useRef(0)
  const flowRunIdRef = useRef(0)

  const userRef = useRef(user)
  userRef.current = user

  const [ debugLogs, setDebugLogs ] = useState<string[]>([])
  const addLog = (msg: string) => setDebugLogs(prev => [...prev, msg])

  // ─── Message handler ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!parentUrl) {
      console.warn("No parent URL configured for iframe communication");
      return;
    }

    const parentOrigin = new URL(parentUrl).origin;

    const handler = async (event: MessageEvent<TWidgetMessage>) => {
      if (!event.data || typeof event.data !== 'object') return;
      const { type, payload } = event.data;
      if (typeof type !== 'string') return;

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
          addLog(`[USER_KEY_READY] redirectUrl: ${userRef.current.redirectUrl}, address: ${userRef.current.address}`)
          if (userRef.current.redirectUrl && userRef.current.address) {
            localStorage.setItem('bringid_session', JSON.stringify({
              address: userRef.current.address,
              key: payload.signature
            }))
            addLog('[USER_KEY_READY] session saved to localStorage')
          }
          return;
        }

        if (type === 'PROOFS_REQUEST') {
          plausible('verify_humanity_request_started');

          const newMode = payload?.mode || 'production'
          const newAppId = payload?.appId || null

          const appChanged = !!userRef.current.appId && (newMode !== userRef.current.mode || newAppId !== userRef.current.appId)
          if (appChanged) {
            dispatch(setKey(null))
            dispatch(addVerifications([]))
            setConfigsPhase('idle')
            setFlowPhase('idle')
            setInvalidAppId(false)
          }

          dispatch(setMode(newMode));
          dispatch(setAppId(newAppId));
          dispatch(setContract(payload?.contract || null));
          dispatch(setContext(payload?.context ?? 0));
          dispatch(setMessage(payload?.message || null));
          dispatch(setMinPoints(payload?.minPoints || 0));
          dispatch(setRedirectUrl(payload?.redirectUrl ? decodeURIComponent(payload.redirectUrl) : null));
          dispatch(setIsMiniApp(payload?.isMiniApp ?? false));

          addLog(`[PROOFS_REQUEST] verificationSignature: ${payload?.verificationSignature ?? 'none'}`)
          addLog(`[PROOFS_REQUEST] verificationMessage: ${payload?.verificationMessage ?? 'none'}`)

          if (payload?.verificationSignature && payload?.verificationMessage) {
            try {
              const sig = decodeURIComponent(payload.verificationSignature)
              const decodedOnce = decodeURIComponent(payload.verificationMessage)
              const msg = JSON.parse(decodedOnce.startsWith('{') ? decodedOnce : decodeURIComponent(decodedOnce)) as TOAuthMessage
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
          window.parent.postMessage({ type: "GENERATE_USER_KEY", payload }, parentOrigin);
          return;
        }
        if (type === 'PROOFS_RESPONSE') {
          setPage('home');
          plausible('verify_humanity_request_finished');
          window.parent.postMessage({ type: "PROOFS_RESPONSE", payload }, parentOrigin);
          return;
        }
        if (type === 'CLOSE_MODAL') {
          setPage('home');
          plausible('close_modal');
          window.parent.postMessage({ type: "CLOSE_MODAL" }, parentOrigin);
          return;
        }
        if (type === 'OPEN_EXTERNAL_URL') {
          addLog(`[OPEN_EXTERNAL_URL] url: ${payload?.url}`)
          window.parent.postMessage({ type: 'OPEN_EXTERNAL_URL', payload }, parentOrigin);
          return;
        }
        return;
      }

      console.warn("Blocked message from untrusted source:", { origin: event.origin, expectedOrigin: parentOrigin, type });
    }

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [parentUrl])

  // ─── Address sync + reset ─────────────────────────────────────────────────
  useEffect(() => {
    if (address) {
      if (user.address && address !== user.address) {
        dispatch(setKey(null))
        dispatch(addVerifications([]))
        setConfigsPhase('idle')
        setFlowPhase('idle')
      }
      dispatch(setAddress(address))
    } else {
      if (user.address) {
        dispatch(setKey(null))
        dispatch(addVerifications([]))
        dispatch(setAddress(null))
        setConfigsPhase('idle')
        setFlowPhase('idle')
      }
    }
    if (apiKey) dispatch(setApiKey(apiKey));
  }, [user.address, apiKey, address]);

  // ─── Load session key from localStorage if present ───────────────────────
  useEffect(() => {
    if (!address) return
    try {
      const raw = localStorage.getItem('bringid_session')
      if (!raw) return
      const session = JSON.parse(raw) as { address: string; key: string }
      addLog(`[localStorage] session found for address: ${session.address}`)
      if (session.address !== address) return
      if (userRef.current.key) return
      addLog('[localStorage] restoring session key')
      dispatch(setKey(session.key))
    } catch {}
  }, [address]);

  // ─── Logout: clear session and reset all state ────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem('bringid_session')
    dispatch(setKey(null))
    dispatch(addVerifications([]))
    setConfigsPhase('idle')
    setFlowPhase('idle')
  }

  useEffect(() => {
    if (customTitles) dispatch(setCustomTitles(customTitles))
  }, [customTitles])

  // ─── Step 1: Load configs + enrich tasks with scores ──────────────────────
  useEffect(() => {
    if (!user.address || !user.mode || !user.appId) {
      setConfigsPhase('idle')
      return
    }

    const runId = ++configsRunIdRef.current
    setConfigsPhase('loading')

    const run = async () => {
      const remoteData = await remoteConfigs(user.mode === 'dev')
      if (configsRunIdRef.current !== runId) return

      dispatch(addModeConfigs(remoteData.configs))

      try {
        const scoresMap = await getAllScores(
          remoteData.configs.REGISTRY,
          user.appId as string,
          remoteData.configs.CHAIN_ID
        )
        if (configsRunIdRef.current !== runId) return

        if (scoresMap === null) {
          setInvalidAppId(true)
          dispatch(addTasks([]))
          dispatch(setLoading(false))
          setConfigsPhase('idle')
          return
        }

        const enrichedTasks = remoteData.tasks
          .map(task => ({
            ...task,
            groups: task.groups.map(group => ({
              ...group,
              score: scoresMap.get(group.credentialGroupId) ?? 0
            }))
          }))
          .filter(task => task.groups.some(group => group.score > 0))

        dispatch(addTasks(enrichedTasks))
      } catch (err) {
        console.error('Failed to fetch scores:', err)
        if (configsRunIdRef.current !== runId) return
        dispatch(addTasks(remoteData.tasks))
      }

      if (configsRunIdRef.current !== runId) return
      setConfigsPhase('done')
    }

    run().catch(err => {
      if (configsRunIdRef.current !== runId) return
      console.error('Failed to load configs:', err)
      dispatch(setLoading(false))
      setConfigsPhase('idle')
    })
  }, [user.address, user.mode, user.appId])

  // ─── Steps 2–4: prev verifications → pending verification → ready ─────────
  //
  // Runs only after configs are loaded and the user key is available.
  // The key arrives either from localStorage (Farcaster) or from USER_KEY_READY.
  // Steps are strictly sequential so addVerifications() never overwrites a
  // freshly scheduled verification from auto-verify.
  useEffect(() => {
    if (configsPhase !== 'done') return
    if (!user.key || !user.appId) {
      dispatch(setLoading(false))
      return
    }

    const runId = ++flowRunIdRef.current
    setFlowPhase('loading')

    // Capture current values — these are stable for the lifetime of this run
    const tasks = userConfigs.tasks
    const modeConfigs = userConfigs.modeConfigs
    const key = user.key
    const appId = user.appId
    const mode = user.mode

    const run = async () => {
      dispatch(setLoading(true))

      // Step 2: fetch prev on-chain verifications and replace store
      let prevVerifs: TVerification[] = []
      if (tasks.length > 0 && modeConfigs.REGISTRY) {
        prevVerifs = await fetchPrevVerifications(tasks, key, appId, modeConfigs)
        if (flowRunIdRef.current !== runId) return
        dispatch(addVerifications(prevVerifs))
      } else {
        dispatch(addVerifications([]))
      }

      if (flowRunIdRef.current !== runId) return

      // Step 3: process pending verification (from PROOFS_REQUEST verificationSignature)
      const pending = pendingVerificationRef.current
      if (pending) {
        addLog(`[auto-verify] domain=${pending.message.domain}, score=${pending.message.score}`)
        const matchingTask = tasks.find(task => task.domain === pending.message.domain)
        addLog(`[auto-verify] matchingTask: ${matchingTask?.id ?? 'not found'}`)

        if (matchingTask) {
          const alreadyVerified = prevVerifs.some(
            v => v.taskId === matchingTask.id && v.status === 'completed'
          )
          addLog(`[auto-verify] alreadyVerified: ${alreadyVerified}`)

          if (alreadyVerified) {
            setPendingVerification(null)
            dispatch(setRedirectUrl(null))
            dispatch(setIsMiniApp(false))
          } else {
          setAutoVerifyingTaskId(matchingTask.id)
          try {
            const group = defineGroupForAuth(matchingTask, pending.message.score)
            if (group) {
              const semaphoreIdentity = createSemaphoreIdentity(key, appId, group.credentialGroupId)

              const verify = await verifierApi.verifyOAuth(
                configs.ZUPLO_API_URL,
                pending.message,
                pending.signature,
                modeConfigs.REGISTRY,
                Number(modeConfigs.CHAIN_ID),
                group.credentialGroupId,
                appId,
                String(semaphoreIdentity.commitment),
                mode
              )

              if (flowRunIdRef.current !== runId) return

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

              if (flowRunIdRef.current !== runId) return

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
            }
          } catch (err) {
            if (flowRunIdRef.current !== runId) return
            console.error('[auto-verify] Failed:', err)
            setAutoVerifyError(typeof err === 'string' ? err : (err as Error).message)
          }

          setAutoVerifyingTaskId(null)
          setPendingVerification(null)
          dispatch(setRedirectUrl(null))
          dispatch(setIsMiniApp(false))
          } // end else (not alreadyVerified)
        }
      }

      if (flowRunIdRef.current !== runId) return

      // Step 4: mark ready — interval can now start
      dispatch(setLoading(false))
      setFlowPhase('ready')
    }

    run().catch(err => {
      if (flowRunIdRef.current !== runId) return
      console.error('Flow failed:', err)
      dispatch(setLoading(false))
      setFlowPhase('ready')
    })
  }, [configsPhase, user.key, user.appId])

  // ─── Step 5: Interval — check task completion every 2s ───────────────────
  useEffect(() => {
    if (flowPhase !== 'ready') return
    if (!verifications) return

    const interval = setInterval(() => {
      try {
        const notCompleted = verifications.filter(v => v.status !== 'completed')
        if (notCompleted.length === 0) return

        let updated = false
        const next = verifications.map(item => {
          if (item.status !== 'completed' && item.scheduledTime - +new Date() <= 0) {
            updated = true
            return { ...item, status: 'completed' as TVerificationStatus }
          }
          return item
        })

        if (updated) dispatch(addVerifications(next))
      } catch (err) {
        console.error({ err });
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [flowPhase, verifications]);

  return <Container>
    <HeaderStyled
      address={user.address}
      userKey={user.key}
      onLogout={handleLogout}
    />
    {loading && !sessionLost && !invalidAppId && <LoadingOverlay title="Thinking..."/>}
    {sessionLost && <ErrorOverlay
      errorText="SESSION_LOST"
      buttonTitle='Close'
      onClose={() => {
        setSessionLost(false)
        window.postMessage({ type: 'CLOSE_MODAL' }, window.location.origin)
      }}
    />}
    {invalidAppId && <ErrorOverlay
      errorText="INVALID_APP_ID"
      buttonTitle='Close'
      onClose={() => {
        setInvalidAppId(false)
        dispatch(setAppId(null))
        dispatch(setMode(''))
        window.postMessage({ type: 'CLOSE_MODAL' }, window.location.origin)
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
        <div>configs: {configsPhase} | flow: {flowPhase}</div>
        <div>isMiniApp: {String(user.isMiniApp)} | hasKey: {String(!!user.key)}</div>
        <div>redirectUrl: {user.redirectUrl ?? 'null'}</div>
        {debugLogs.map((log, i) => <div key={i}>{log}</div>)}
      </div>
    )}
    <Content>
      {defineContent(page, setPage, autoVerifyingTaskId)}
    </Content>
  </Container>
}

export default InnerContent
