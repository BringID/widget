import styled from 'styled-components'
import {
  VerificationSelectList
} from '../../components'
import {
  Button,
  Title,
  Text,
  Message
} from '@/components/common'

export const Container = styled.div`
  padding: 16px;
`

export const VerificationSelectListStyled = styled(VerificationSelectList)`
  margin-bottom: 20px;
`

export const ButtonStyled = styled(Button)`
  flex: 1;
`

export const TitleStyled = styled(Title)`
  margin-bottom: 8px;
  font-size: 24px;
`

export const TextStyled = styled(Text)`
  margin-bottom: 24px;
`

export const MessageStyled = styled(Message)`
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`

export const ButtonsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
`;
