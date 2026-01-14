import styled from 'styled-components';
import { Button } from '@/components/common';
import { Icons } from '@/components/common';

export const KeyIcon = styled(Icons.KeyIcon)`
  min-width: 36px;
  height: auto;
`

export const Container = styled.div`
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: auto;
`;

export const Title = styled.h3`
  font-size: 27px;
  font-weight: 600;
  line-height: 27px;
  margin: 0 0 24px;
  color: ${(props) => props.theme.primaryTextColor};
  text-align: center;
`;

export const ButtonsStyled = styled(Button)`
  width: max-content;
  margin: 10px auto;
  min-width: 250px;
`;

export const IconContainer = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  margin-bottom: 40px;
  justify-content: center;
  background-color: ${props => props.theme.iconContainerBackgroundColor};
`

export const ButtonInvisible = styled.div`
  width: 200px;
  height: 100px;
  opacity: 0;
`