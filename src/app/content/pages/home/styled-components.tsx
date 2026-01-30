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
    bottom: 0;
    left: 0;
    right: 0;
    height: 4px;
    pointer-events: none;
    z-index: 1;

    background: linear-gradient(
      to bottom,
      ${props => props.theme.scrollContainerInnerShadowColor},
      transparent
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