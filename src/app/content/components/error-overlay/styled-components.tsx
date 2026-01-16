import {
  Title,
  Text,
  Button
} from '@/components/common';

import styled from 'styled-components';

export const Container = styled.div`
  padding: 12px;
  height: 100%;
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  z-index: 1;
  left: 0;
  background-color: ${(props) => props.theme.overlayBackgroundColor};
`;

export const TitleStyled = styled(Title)`
  text-align: center;
  font-size: 24px;
  margin: 0 0 20px;
`;

export const TextStyled = styled(Text)`
  margin: 0 0 28px;
  text-align: center;
`

export const Content = styled.div`
  padding: 24px;
  border-radius: 8px;
  border: 1px solid ${(props) => props.theme.secondaryBorderColor};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
`;

export const Wrapper = styled.div`
  height: 100%;
`;


export const ButtonStyled = styled(Button)`
  width: 100%;
`