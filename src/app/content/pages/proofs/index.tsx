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
  FooterStyled
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

const renderContent = (
  minPoints: number,
  availablePoints: number,
  verifications: TVerification[],
  selected: string[],
  setSelected: (selected: string[]) => void,
) => {

  const isEnoughPoints = availablePoints >= minPoints

  if (!isEnoughPoints) {
    return null
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
  setPage: TSetPage
) => {

  const isEnoughPoints = availablePoints >= minPoints

  if (
    !isEnoughPoints
  ) {
    return <ButtonStyled
      appearance='action'
      onClick={() => setPage('home')}
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

        onConfirm(
          proofs,
          pointsSelected
        )
      } catch (err) {
        console.log({ err })
        const myErr = err as Error
        if (myErr.message) {
          alert(myErr.message)
        } else {
          alert('Some error occured. Please try later')
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

  const userConfigs = useConfigs()
  const [loading, setLoading] = useState<boolean>(false);
  const availablePoints = calculateAvailablePoints(verifications, userConfigs.tasks); //devMode

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
        userKey={user.key}
      >
        {renderButton(
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
          setPage
        )}
      </FooterStyled>
    </>
    
  );
};

export default Proofs
