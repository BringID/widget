'use client'
import React, { FC } from 'react';
import TProps from './types';
import {
  Container,
  Title,
  ButtonsStyled,
  IconContainer,
  KeyIcon
} from './styled-components'
import { Icons } from '@/components/common';

const Authorize: FC<TProps> = ({ className }) => {
  
  return (
    <Container className={className}>

      <IconContainer>
        <KeyIcon></KeyIcon>
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
    </Container>
  );
};

export default Authorize;
