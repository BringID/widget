'use client'
import { FC, useEffect, useState } from 'react'
import {
  Container,
} from './styled-components'
import { TProps } from './types'
import { Home, Proofs } from '../pages'
import { useDispatch } from 'react-redux'
// import {
//   registerOpenModal
// } from '../events/event-bus';
import { setIsOpen, setLoading, useModal } from '../store/reducers/modal';
import { setAddress, setApiKey, setKey, useUser } from '../store/reducers/user';
import { TVerification, TVerificationStatus, TTask } from '@/types';
import semaphore from '../semaphore';
import { tasks } from '../../core'
import {
  addVerifications,
  useVerifications
} from '../store/reducers/verifications';
import { LoadingOverlay } from '../components'
// import { setProofsGeneratedCallback, callProofsGeneratedCallback } from '../callbacks'

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
        // if (!callProofsGeneratedCallback) {
        //   return alert('proofsGeneratedCallback not passed')
        // }

        // callProofsGeneratedCallback(
        //   proofs,
        //   pointsSelected
        // )
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
  parentUrl
}) => {

  const dispatch = useDispatch()

  const { isOpen, loading } = useModal()
  const user = useUser()
  const { verifications } = useVerifications()



  useEffect(() => {
    window.addEventListener("message", async (event) => {
      const { type, requestId, payload } = event.data

      if (parentUrl) {
        const url = new URL(parentUrl)
        if (event.origin === url.origin) { // event comes from the place where the widget is rendered
          if (type === 'USER_KEY_READY') {
            // save it in store
          }
        } else if (event.source === window) {
          if (type === 'GENERATE_USER_KEY') {

            window.parent.postMessage(
              {
                type: "GENERATE_USER_KEY",
                requestId,
                payload
              },
              url.origin
            )
          }
        }
      }  
      console.warn("Blocked message from untrusted origin:", event.origin);
    });
  }, [])

  // useEffect(() => {
  //   registerOpenModal((
  //     args
  //   ) => {
  //     setPage('home');
  //     dispatch(setIsOpen(true))
  //     dispatch(setScope(args.scope || null))
  //     setProofsGeneratedCallback(args.proofsGeneratedCallback)
  //   });
  // }, []);


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

  const availableTasks = tasks(true)

  const [ page, setPage ] = useState('home')

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
        // new address is undefined
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
    address 
  ]);

  useEffect(() => {
    if (!user.key) return

    uploadPrevVerifications(
      availableTasks,
      user.key,
      (loading: boolean) => dispatch(setLoading(loading)),
      (verifications) => {
        console.log('HERE uploading verifications')
        dispatch(addVerifications(verifications))
      }
    )
  }, [
    user.key
  ]);

    return <Container>
      {loading && <LoadingOverlay title="Loading..."/>}
      {defineContent(
        page,
        setPage,
        () => {
          dispatch(setIsOpen(false))
        }
      )}
    </Container>
}

export default InnerContent