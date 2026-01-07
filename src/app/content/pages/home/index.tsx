'use client'

import { FC } from 'react';
import {
  Container,
  VerificationsListStyled,
  ButtonStyled
} from './styled-components';
import { Header } from '../../components';
import { useVerifications } from '../../store/reducers/verifications';
import { tasks } from '@/app/core/tasks';
import {
  LoadingOverlay,
  Authorize,
} from '../../components';
import { calculateAvailablePoints } from '@/utils';
import { useUser } from '../../store/reducers/user';
import { TVerification, TTask } from '@/types';
import { TProps } from './types'

const renderContent = (
  userKey: string | null,
  availableTasks: TTask[],
  verifications: TVerification[],
  devMode: boolean,
  setPage: (page: string) => void,
) => {
  if (!userKey) {
    return <Authorize />
  }

  const finishedVerifications = verifications.filter(verification => {
    return verification.status === 'completed'
  })

  return <>
    <VerificationsListStyled
      tasks={availableTasks}
      devMode={devMode}
      verifications={verifications}
    />

    <ButtonStyled
      disabled={finishedVerifications.length === 0}
      appearance='action'
      onClick={() => {
        setPage('proofs')
      }}
    >
      Continue
    </ButtonStyled>
  </>
};

const Home: FC<TProps> = ({
  setPage
}) => {
  const verificationsStore = useVerifications();
  const { verifications, loading } = verificationsStore;
  const user = useUser();

  const availableTasks = tasks(true); //devMode

  const availablePoints = calculateAvailablePoints(verifications, true); //devMode

  return (
    <Container>
      {loading && <LoadingOverlay title="Processing verification..." />}
      <Header
        points={availablePoints}
        address={user.address}
        userKey={user.key}
      />

      {renderContent(
        user.key,
        availableTasks,
        verifications,
        true, // dev
        setPage
      )}
    </Container>
  );
};

export default Home;
