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
import { setLoading, useModal, setMinPoints } from '../store/reducers/modal';
import { setAddress, setApiKey, setAppId, setKey, setMessage, setMode, setScope, useUser } from '../store/reducers/user';
import { TVerification, TVerificationStatus, TTask, TModeConfigs, TWidgetMessage } from '@/types';
import semaphore from '../semaphore';
import { configs } from '../../core'
import {
  addVerifications,
  useVerifications
} from '../store/reducers/verifications';
import { LoadingOverlay } from '../components'
import { addModeConfigs, addTasks, useConfigs } from '../store/reducers/configs'
import { usePlausible } from 'next-plausible'
import { getAppSemaphoreGroupId, getAllScores } from '@/utils'

const defineContent = (
  page: string,
  setPage: (page: string) => void,
) => {
  switch (page) {
    case 'home': return <Home
      setPage={setPage}
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
    console.log('REQUEST')

    const proofs = await semaphore.getProofs(
      identityDataList.map(({ identityCommitment, semaphoreGroupId }) => ({
        identityCommitment,
        semaphoreGroupId
      })),
      modeConfigs
    )
    console.log('REQUEST FINISHED: ', proofs)

    if (proofs) {
      for (const proofResult of proofs) {
        if (proofResult.success) {

          console.log({ identityDataList })
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
}) => {

  const dispatch = useDispatch()

  const { loading } = useModal()
  const user = useUser()
  const { verifications } = useVerifications()
  const [ page, setPage ] = useState('home')
  const userConfigs = useConfigs()
  const plausible = usePlausible()
  const userRef = useRef(user)
  userRef.current = user

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
          plausible('generate_user_key_finished');
          dispatch(setKey(payload.signature));
          return;
        }
        
        if (type === 'PROOFS_REQUEST') {
          plausible('verify_humanity_request_started');

          const newMode = payload?.mode || 'production'
          const newAppId = payload?.appId || null

          if (newMode !== userRef.current.mode || newAppId !== userRef.current.appId) {
            dispatch(setKey(null))
            dispatch(addVerifications([]))
          }

          dispatch(setMode(newMode));
          dispatch(setAppId(newAppId));
          dispatch(setScope(payload?.scope || null));
          dispatch(setMessage(payload?.message || null));
          dispatch(setMinPoints(payload?.minPoints || 0));
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
          console.log({ type: "PROOFS_RESPONSE", payload })
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
        console.log({ verificationsUpdated })
    
        if (updated) dispatch(addVerifications(verificationsUpdated))

      } catch (err) {
        console.log({ err });
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
  console.log({ user })

  useEffect(() => {

    if (!user.address) return
    if (!user.mode) return
    if (!user.appId) return

    const init = async () => {
      const userConfigs = await configs(user.mode === 'dev')
      dispatch(addModeConfigs(userConfigs.configs))

      try {
        const scoresMap = await getAllScores(
          userConfigs.configs.REGISTRY,
          user.appId as string,
          userConfigs.configs.CHAIN_ID
        )
        const enrichedTasks = userConfigs.tasks.map(task => ({
          ...task,
          groups: task.groups.map(group => ({
            ...group,
            score: scoresMap.get(group.credentialGroupId) ?? 0
          }))
        }))
        dispatch(addTasks(enrichedTasks))
      } catch (err) {
        console.error('Failed to fetch scores:', err)
        dispatch(addTasks(userConfigs.tasks))
      }
    }
    init()
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
    if (
      userConfigs.tasks.length === 0
    ) return
    if (
      !userConfigs.modeConfigs.REGISTRY
    ) return

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
    {loading && <LoadingOverlay title="Thinking..."/>}
    <Content>
      {defineContent(
        page,
        setPage,
      )}
    </Content>
  </Container>
}

export default InnerContent