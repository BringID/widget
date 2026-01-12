import React, { FC } from 'react';
import {
  Container,
  SpinnerStyled,
  TitleStyled,
  Content,
} from './styled-components';
import TProps from './types';

const LoadingOverlay: FC<TProps> = ({ title }) => {
  return (
    <Container>
      <Content>
        <SpinnerStyled size="large" />
        <TitleStyled>{title}</TitleStyled>
      </Content>
    </Container>
  );
};

export default LoadingOverlay;
