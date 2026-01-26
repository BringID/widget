'use client'
import { FC, useEffect, useState } from 'react'
import {
  Container,
  FooterStyled,
  Content,
  HeaderStyled
} from './styled-components'
import { TProps } from './types'
import { Home, Proofs } from '../pages'
import { useDispatch } from 'react-redux'
import { setRequestId, setLoading, useModal, setMinPoints } from '../store/reducers/modal';
import { setAddress, setApiKey, setKey, setMode, setScope, useUser } from '../store/reducers/user';
import { TVerification, TVerificationStatus, TTask, TModeConfigs } from '@/types';
import semaphore from '../semaphore';
import {
  addVerifications,
  useVerifications
} from '../store/reducers/verifications';
import { LoadingOverlay } from '../components'
import { addModeConfigs, addTasks, useConfigs } from '../store/reducers/configs'
import { usePlausible } from 'next-plausible'
import configs from '@/app/configs'
import { configs as coreConfigs } from '../../core'

const defineContent = (
  page: string,
  setPage: (page: string) => void,
  requestId: null | string
) => {
  switch (page) {
    case 'home': return <Home
      setPage={setPage}
    />
    case 'proofs': return <Proofs
      onCancel={() => {
        window.postMessage({
          type: 'CLOSE_MODAL',
          requestId,
        }, window.location.origin)
      }}
      onConfirm={(proofs, pointsSelected) => {
        window.postMessage({
          type: 'PROOFS_RESPONSE',
          requestId,
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
  setLoading: (
    loading: boolean
  ) => void,
  modeConfigs: TModeConfigs,
  addVerifications: (verifications: TVerification[]) => void
) => {
  setLoading(true)

  const verifications: TVerification[] = []
  for (const task of tasks) {
    for (const group of task.groups) {
      const identity = semaphore.createIdentity(
        String(userKey),
        group.credentialGroupId,
      )

      const { commitment } = identity;

      try {
        const proof = await semaphore.getProof(
          String(commitment),
          group.semaphoreGroupId,
          modeConfigs
        );
        if (proof) {
          const newTask = {
            credentialGroupId: group.credentialGroupId,
            status: 'completed' as TVerificationStatus,
            scheduledTime: +new Date(),
            fetched: true,
            taskId: task.id,
          }
          verifications.push(newTask)
        }
      } catch (err) {
        console.log(`proof for ${commitment} was not added before`);
      }
    }
  }

  addVerifications(verifications)


  setLoading(false)
}

const InnerContent: FC<TProps> = ({
  apiKey,
  address,
  parentUrl,
  mode
}) => {

  const dispatch = useDispatch()

  const { loading } = useModal()
  const user = useUser()
  const modal = useModal()
  const { verifications } = useVerifications()
  const [ page, setPage ] = useState('home')
  const userConfigs = useConfigs()
  const plausible = usePlausible()

  useEffect(() => {
    window.addEventListener("message", async (event) => {
      const { type, requestId, payload } = event.data
      if (parentUrl) {
        const url = new URL(parentUrl)
        if (event.origin === url.origin) { // event comes from the place where the widget is rendered
          if (type === 'USER_KEY_READY') {
            // save it in store

            plausible('generate_user_key_finished')
            dispatch(setKey(payload.signature))
            return
          }

          if (type === 'PROOFS_REQUEST') {
            plausible('verify_humanity_request_started')
            dispatch(setScope(payload ? (payload.scope || null) : null))
            dispatch(setMinPoints(payload ? (payload.minPoints || 0) : 0))
            dispatch(setRequestId(requestId))
            return
          }

        } else if (event.source === window) {
          if (type === 'GENERATE_USER_KEY') {
            plausible('generate_user_key_started')
            window.parent.postMessage(
              {
                type: "GENERATE_USER_KEY",
                payload
              },
              url.origin
            )
            return
          } else if (type === 'PROOFS_RESPONSE') {
            setPage('home')
            plausible('verify_humanity_request_finished')
            window.parent.postMessage(
              {
                type: "PROOFS_RESPONSE",
                requestId,
                payload
              },
              url.origin
            )

            return

          } else if (type === 'CLOSE_MODAL') {
            setPage('home')
            plausible('close_modal')
            window.parent.postMessage(
              {
                type: "CLOSE_MODAL",
                requestId
              },
              url.origin
            )

            return
          }
        }
      }  
      console.warn("Blocked message from untrusted origin:", event.origin);
    });
  }, [])


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
            const now = +new Date() + Number(configs.TASK_PENDING_TIME);
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

    if (mode) {
      dispatch(setMode(mode));
    }

  }, [
    user.address,
    apiKey,
    address,
    mode
  ]);

  useEffect(() => {
    if (!user.address) { return }
    if (!user.mode) { return }
  
    const init = async () => {
      const userConfigs = await coreConfigs(user.mode === 'dev')
      dispatch(addModeConfigs(userConfigs.configs))
      dispatch(addTasks(userConfigs.tasks))
    }
    init()
  }, [
    user.address,
    user.mode
  ])

  useEffect(() => {
    if (!user.key) return
    if (
      userConfigs.tasks.length === 0
    ) return
    if (
      !userConfigs.modeConfigs.REGISTRY
    ) return

    uploadPrevVerifications(
      userConfigs.tasks,
      user.key,
      (loading: boolean) => dispatch(setLoading(loading)),
      userConfigs.modeConfigs,
      (verifications) => {
        console.log('HERE uploading verifications')
        dispatch(addVerifications(verifications))
      }
    )
  }, [
    userConfigs,
    user.key
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
        modal.requestId
      )}
    </Content>
  </Container>
}

export default InnerContent