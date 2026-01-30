import styled from 'styled-components'
import { VerificationsList, Footer } from '../../components'
import { Button } from '@/components/common'


export const FooterStyled = styled(Footer)``

export const Container = styled.div`
  padding: 16px;
  height: 100%;
  overflow-y: auto;
  min-height: 0;
  position: relative;

  &::after {
    content: "";
    position: sticky;
    bottom: 0px;
    left: 0px;
    right: 0px;
    height: 20px;
    pointer-events: none;
    display: block;

    // needs to compensate padding
    transform: translateY(16px);

    background: linear-gradient(
      to bottom,
      transparent,
      ${props => props.theme.primaryBackgroundColor},
    );
  }
`;

export const AuthorizeContent = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
`

export const VerificationsListStyled = styled(VerificationsList)`
  margin-bottom: 20px;
`;

export const ButtonStyled = styled(Button)`
`