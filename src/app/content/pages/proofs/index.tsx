'use client'

import {
  FC,
  useState,
  useMemo,
  useEffect
} from 'react'
import {
  Container,
  VerificationSelectListStyled,
  ButtonStyled,
  TextStyled,
  TitleStyled,
  FooterStyled,
  MessageStyled,
  TagStyled
} from './styled-components'
import { useVerifications } from '../../store/reducers/verifications'
import {
  calculateAvailablePoints,
  defineTaskByCredentialGroupId,
  defineInitialSelectedVerifications
} from '@/utils'
import { useUser } from '../../store/reducers/user'
import {
  TVerification,
  TTask,
  TModeConfigs
} from '@/types'
import {
  TProps,
  TOnCancel,
  TOnConfirm,
  TSetPage
} from './types'
import { prepareProofs } from '../../utils'
import { useConfigs } from '../../store/reducers/configs'
import { useModal } from '../../store/reducers/modal'
import { usePlausible } from 'next-plausible'
import { ErrorOverlay } from '../../components'

const renderContent = (
  minPoints: number,
  availablePoints: number,
  verifications: TVerification[],
  selected: string[],
  setSelected: (selected: string[]) => void,
) => {

  const isEnoughPoints = availablePoints >= minPoints

  if (!isEnoughPoints) {
    return <MessageStyled status='error'>
      Required Bring Score: <TagStyled status='info'>
        {minPoints} pts.
      </TagStyled>
    </MessageStyled>
  }

  return (
    <VerificationSelectListStyled
      verifications={verifications}
      selected={selected}
      onSelect={(id, isSelected) => {
        if (!isSelected) {
          setSelected(
            selected.filter((verification) => verification !== id),
          );
          return;
        }
        setSelected([...selected, id]);
      }}
      
    />
  );
}

const renderTitles = (
  minPoints: number,
  availablePoints: number
) => {

  const isEnoughPoints = availablePoints >= minPoints

  if (!isEnoughPoints) {
    return <>
      <TitleStyled>Cannot verify humanity</TitleStyled>
      <TextStyled>
        Not enough points available to verify. Please add new verifications on the previous screen
      </TextStyled>
    </>
  }

  return <>
    <TitleStyled>Prove your trust level</TitleStyled>
    <TextStyled>
      A website is requesting verification of your trust score. This process is private and no personal information will be shared.
    </TextStyled>
  </>
}

const renderButton = (
  plausibleEvent: (eventName: string) => void,
  userKey: string,
  loading: boolean,
  setLoading: (loading: boolean) => void,
  selected: string[],
  minPoints: number,
  availablePoints: number,
  tasks: TTask[],
  modeConfigs: TModeConfigs,
  verifications: TVerification[],
  scope: string | null,
  pointsSelected: number,
  onConfirm: TOnConfirm,
  onCancel: TOnCancel,
  onError: (errorText: string) => void,
  setPage: TSetPage
) => {

  const isEnoughPoints = availablePoints >= minPoints

  if (
    !isEnoughPoints
  ) {
    return <ButtonStyled
      appearance='action'
      onClick={() => {
        setPage('home')
        plausibleEvent('back_to_home')
      }}
    >
      Back
    </ButtonStyled>
  }

  return <ButtonStyled
    appearance='action'
    loading={loading}
    disabled={
      selected.length === 0 || (pointsSelected < minPoints)
    }
    onClick={async () => {
      setLoading(true)
      try {
        plausibleEvent('prepare_proofs_started')
        const proofs = await prepareProofs(
          tasks,
          userKey,
          verifications,
          scope,
          pointsSelected,
          selected,
          modeConfigs
        );

        if (!proofs || !pointsSelected) {
          return onCancel()
        }
        plausibleEvent('prepare_proofs_finished')

        onConfirm(
          proofs,
          pointsSelected
        )
      } catch (err) {
        console.log({ err })
        plausibleEvent('prepare_proofs_failed')
        const myErr = err as Error
        if (myErr.message) {
          onError(myErr.message)
        } else {
          onError('SOME_ERROR_OCCURED_WHILE_FETCHING_PROOFS')
        }
      }
      setLoading(false)
    }}
  >
    Confirm ({pointsSelected} pts selected)
  </ButtonStyled>
}

const Proofs: FC<TProps> = ({
  onConfirm,
  onCancel,
  setPage
}) => {
  const { verifications } = useVerifications();
  const user = useUser()
  const modal = useModal()

  const [ error, setError ] = useState<string | null>(null)

  const userConfigs = useConfigs()
  const [loading, setLoading] = useState<boolean>(false);
  const availablePoints = calculateAvailablePoints(verifications, userConfigs.tasks); //devMode
  const plausible = usePlausible()
  const [selected, setSelected] = useState<string[]>([]);

  const pointsSelected = useMemo(() => {
    let result = 0;

    verifications.forEach((verification) => {
      const relatedTask = defineTaskByCredentialGroupId(
        verification.credentialGroupId,
        userConfigs.tasks
      );

      if (!relatedTask) {
        return;
      }
      if (verification.status !== 'completed') {
        return;
      }

      if (!selected.includes(relatedTask.group.credentialGroupId)) {
        return;
      }

      if (relatedTask) {
        result = result + relatedTask.group.points;
      }
    });

    return result;
  }, [selected]);

  useEffect(() => {
    if (!verifications) {
      return;
    }

    setSelected(defineInitialSelectedVerifications(verifications));
  }, [verifications]);


  return (
    <>

      {error && <ErrorOverlay
        errorText={error}
        onClose={() => {
          setError(null)
        }}
      />}

      <Container>
        {renderTitles(modal.minPoints, availablePoints)}

        {renderContent(
          modal.minPoints,
          availablePoints,
          verifications,
          selected,
          setSelected
        )}
      </Container>
      <FooterStyled
        points={availablePoints}
        address={user.address}
      >
        {renderButton(
          (eventName) => plausible(eventName),
          user.key as string,
          loading,
          setLoading,
          selected,
          modal.minPoints,
          availablePoints,
          userConfigs.tasks,
          userConfigs.modeConfigs,
          verifications,
          user.scope,
          pointsSelected,
          onConfirm,
          onCancel,
          (errorMessage) => setError(errorMessage),
          setPage
        )}
      </FooterStyled>
    </>
    
  );
};

export default Proofs
