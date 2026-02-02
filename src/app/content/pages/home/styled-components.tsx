import styled from 'styled-components'
import { VerificationsList, Footer } from '../../components'
import { Button } from '@/components/common'


export const FooterStyled = styled(Footer)`
  box-shadow: 15px -40px 60px -10px ${props => props.theme.primaryBackgroundColor}, -15px -40px 60px -20px ${props => props.theme.primaryBackgroundColor};
`

export const Container = styled.div`
  padding: 16px;
  height: 100%;
  overflow-y: auto;
  min-height: 0;
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