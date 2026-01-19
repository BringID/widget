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
import { setIsOpen, setLoading, useModal } from '../store/reducers/modal';
import { setAddress, setApiKey, setKey, setMode, setScope, useUser } from '../store/reducers/user';
import { TVerification, TVerificationStatus, TTask, TModeConfigs } from '@/types';
import semaphore from '../semaphore';
import { configs } from '../../core'
import {
  addVerifications,
  useVerifications
} from '../store/reducers/verifications';
import { LoadingOverlay } from '../components'
import { addModeConfigs, addTasks, useConfigs } from '../store/reducers/configs'

const defineContent = (
  page: string,
  setPage: (page: string) => void,
  closeModal: () => void,

) => {
  switch (page) {
    case 'home': return <Home
      setPage={setPage}
    />
    case 'proofs': return <Proofs
      onCancel={() => {
        setPage('home')
        closeModal()
      }}
      onConfirm={(proofs, pointsSelected) => {
        window.postMessage({
          type: 'PROOFS_READY',
          payload: {
            proofs,
            points: pointsSelected
          }
        }, window.location.origin)
      }}
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
  const { verifications } = useVerifications()
  const [ page, setPage ] = useState('home')
  const userConfigs = useConfigs()

  useEffect(() => {
    window.addEventListener("message", async (event) => {
      const { type, requestId, payload } = event.data

      if (parentUrl) {
        const url = new URL(parentUrl)

        console.log('WIDGET: ', event, url, payload, type)
        if (event.origin === url.origin) { // event comes from the place where the widget is rendered
          if (type === 'USER_KEY_READY') {
            // save it in store
            dispatch(setKey(payload.signature))
            return
          }

          if (type === 'REQUEST_PROOFS') {
            dispatch(setScope(payload.scope))
            return
          }
        } else if (event.source === window) {
          if (type === 'GENERATE_USER_KEY') {
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
            window.parent.postMessage(
              {
                type: "PROOFS_RESPONSE",
                requestId,
                payload
              },
              url.origin
            )

          } else if (type === 'CLOSE_MODAL') {
            setPage('home')

            window.parent.postMessage(
              {
                type: "CLOSE_MODAL"
              },
              url.origin
            )
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
      const userConfigs = await configs(user.mode === 'dev')
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
        () => {
          dispatch(setIsOpen(false))
        }
      )}
    </Content>
  </Container>
}

export default InnerContent