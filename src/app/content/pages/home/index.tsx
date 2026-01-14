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
import {
  LoadingOverlay,
  Authorize,
} from '../../components';
import { calculateAvailablePoints } from '@/utils';
import { useUser } from '../../store/reducers/user';
import { TVerification, TTask } from '@/types';
import { TProps } from './types'
import { useConfigs } from '../../store/reducers/configs';

const renderContent = (
  userKey: string | null,
  verifications: TVerification[],
) => {
  if (!userKey) {
    return <AuthorizeContent>
      <Authorize />
    </AuthorizeContent>
  }

  return <VerificationsListStyled
    verifications={verifications}
  />
}

const Home: FC<TProps> = ({
  setPage
}) => {
  const verificationsStore = useVerifications();
  const { verifications, loading } = verificationsStore;
  const user = useUser();
  const userConfigs = useConfigs()

  const availablePoints = calculateAvailablePoints(verifications, userConfigs.tasks); //devMode
  const finishedVerifications = verifications.filter(verification => {
    return verification.status === 'completed'
  })

  return (
    <>
      <Container>
        {loading && <LoadingOverlay title="Processing verification..." />}
        {renderContent(
          user.key,
          verifications,
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
