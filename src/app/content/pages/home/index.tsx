'use client'

import { FC } from 'react';
import {
  Container,
  VerificationsListStyled,
  ButtonStyled,
  AuthorizeContent,
  FooterStyled
} from './styled-components';
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
) => {
  if (!userKey) {
    return <AuthorizeContent>
      <Authorize />
    </AuthorizeContent>
  }

  return <VerificationsListStyled
    tasks={availableTasks}
    devMode={devMode}
    verifications={verifications}
  />
}

const Home: FC<TProps> = ({
  setPage
}) => {
  const verificationsStore = useVerifications();
  const { verifications, loading } = verificationsStore;
  const user = useUser();

  const availableTasks = tasks(true); //devMode
  const availablePoints = calculateAvailablePoints(verifications, true); //devMode
  const finishedVerifications = verifications.filter(verification => {
    return verification.status === 'completed'
  })

  return (
    <>
      <Container>
        {loading && <LoadingOverlay title="Processing verification..." />}
        {renderContent(
          user.key,
          availableTasks,
          verifications,
          true, // dev
        )}
      </Container>

      <FooterStyled
        points={availablePoints}
        address={user.address}
        userKey={user.key}
      >
        <ButtonStyled
          disabled={finishedVerifications.length === 0}
          appearance='action'
          onClick={() => {
            setPage('proofs')
          }}
        >
          Continue
        </ButtonStyled>
      </FooterStyled>
    </>
  );
};

export default Home;
