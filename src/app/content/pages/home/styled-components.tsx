import styled from 'styled-components'
import { VerificationsList, Footer } from '../../components'
import { Button } from '@/components/common'


export const FooterStyled = styled(Footer)``

export const Container = styled.div`
  padding: 16px;
  height: 100%;
  overflow-y: auto;
  min-height: 0;
  box-shadow: inset 0 3px 3px -3px ${props => props.theme.scrollContainerInnerShadowColor}, inset 0 -3px 3px -3px ${props => props.theme.scrollContainerInnerShadowColor};
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