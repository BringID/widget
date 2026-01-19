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
import { TVerification, TTask, TModeConfigs } from '@/types'
import { TProps } from './types'
import { prepareProofs } from '../../utils'
import { useConfigs } from '../../store/reducers/configs'

const renderContent = (
  verifications: TVerification[],
  selected: string[],
  setSelected: (selected: string[]) => void
) => {

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
};

const Proofs: FC<TProps> = ({
  onConfirm,
  onCancel
}) => {
  const { verifications } = useVerifications();
  const user = useUser()
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
        <TitleStyled>Prove your trust level</TitleStyled>
        <TextStyled>
          A website is requesting verification of your trust score. This process is private and no personal information will be shared.
        </TextStyled>

        {renderContent(
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
        <ButtonStyled
          appearance='action'
          loading={loading}
          disabled={selected.length === 0}
          onClick={async () => {
            setLoading(true)
            try {
              const proofs = await prepareProofs(
                userConfigs.tasks,
                user.key as string,
                verifications,
                user.scope,
                pointsSelected,
                selected,
                userConfigs.modeConfigs
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
              onCancel()
            }
            setLoading(false)
            
          }}
        >
          Confirm ({pointsSelected} pts selected)
        </ButtonStyled>
      </FooterStyled>
    </>
    
  );
};

export default Proofs
