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
    if (!parentUrl) {
      console.warn("No parent URL configured for iframe communication");
      return;
    }

    const parentOrigin = new URL(parentUrl).origin;

    const handler = async (event: MessageEvent<TWidgetMessage>) => {
      if (!event.data || typeof event.data !== 'object') {
        return;
      }

      const { type, requestId, payload } = event.data;


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
          dispatch(setScope(payload?.scope || null));
          dispatch(setMinPoints(payload?.minPoints || 0));
          dispatch(setRequestId(requestId || null));
          return;
        }

        console.warn('Unknown message type from parent:', type);
        return;
      }

      console.log('EVENT::', { event })

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
          console.log({ type: "PROOFS_RESPONSE", requestId, payload })
          window.parent.postMessage(
            { type: "PROOFS_RESPONSE", requestId, payload },
            parentOrigin
          );
          return;
        }

        if (type === 'CLOSE_MODAL') {
          setPage('home');
          plausible('close_modal');
          window.parent.postMessage(
            { type: "CLOSE_MODAL", requestId },
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