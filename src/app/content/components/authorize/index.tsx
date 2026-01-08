'use client'
import React, { FC } from 'react';
import TProps from './types';
import { Container, Title, ButtonsStyled } from './styled-components'

const Authorize: FC<TProps> = ({ className }) => {
  
  return (
    <Container className={className}>
      <Title>Connect your wallet to start verifying</Title>

      <ButtonsStyled
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
