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
import { tasks } from '@/app/core/tasks'
import {
  calculateAvailablePoints,
  defineTaskByCredentialGroupId,
  defineInitialSelectedVerifications
} from '@/utils'
import { useUser } from '../../store/reducers/user'
import { TVerification, TTask } from '@/types'
import { TProps } from './types'
import { prepareProofs } from '../../utils'

const renderContent = (
  availableTasks: TTask[],
  verifications: TVerification[],
  devMode: boolean,
  selected: string[],
  setSelected: (selected: string[]) => void
) => {

  return (
    <VerificationSelectListStyled
      tasks={availableTasks}
      devMode={devMode}
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
  const [loading, setLoading] = useState<boolean>(false);


  const availableTasks = tasks(true); //devMode


  const availablePoints = calculateAvailablePoints(verifications, true); //devMode


  const [selected, setSelected] = useState<string[]>([]);

  const pointsSelected = useMemo(() => {
    let result = 0;

    verifications.forEach((verification) => {
      const relatedTask = defineTaskByCredentialGroupId(
        verification.credentialGroupId,
        true // devmode
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
          availableTasks,
          verifications,
          true, // dev
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
                user.key as string,
                verifications,
                user.scope,
                pointsSelected,
                selected,
              );

              onConfirm(
                proofs,
                pointsSelected
              )
              onCancel()
            } catch (err) {

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
