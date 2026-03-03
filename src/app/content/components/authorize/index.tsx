'use client'
import React, { FC } from 'react';
import TProps from './types';
import {
  Container,
  Title,
  ButtonsStyled,
  IconContainer,
  KeyIcon,
  ButtonInvisible
} from './styled-components'
import { getZKTLSSemaphoreData } from '@/utils';


const Authorize: FC<TProps> = ({ className }) => {
  
  return (
    <Container className={className}>

      <IconContainer>
        <KeyIcon />
      </IconContainer>
      <Title>Create your private key to start verification</Title>

      <ButtonsStyled
        appearance='action'
        onClick={async() => {
          window.postMessage({
            type: 'GENERATE_USER_KEY',
            payload: {
              message: `Sign to derive your BringID key.
Recoverable by re-signing with the same wallet.`
            }
          }, window.location.origin)
        }}
      >
        Create BringID key
      </ButtonsStyled>

      <iframe
        src="https://staging-oauth-server-production.up.railway.app/auth/github/login"
        style={{ width: '100%', height: '400px', border: '1px solid red', marginTop: '16px' }}
        title="GitHub Login Test"
      />
    </Container>
  );
};

export default Authorize;
