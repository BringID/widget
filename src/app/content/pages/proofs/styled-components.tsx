import styled from 'styled-components'
import {
  VerificationSelectList,
  Footer
} from '../../components'
import {
  Button,
  Title,
  Text,
  Message,
  Tag
} from '@/components/common'

export const FooterStyled = styled(Footer)``

export const Container = styled.div`
  padding: 16px;

  overflow-y: auto;    /* ✅ only this scrolls */
  min-height: 0;       /* 🔑 also critical */
`

export const VerificationSelectListStyled = styled(VerificationSelectList)`
  margin-bottom: 20px;
`

export const ButtonStyled = styled(Button)`

`

export const TitleStyled = styled(Title)`
  margin-bottom: 8px;
  font-size: 24px;
  text-align: center;
`

export const TextStyled = styled(Text)`
  margin-bottom: 24px;
  text-align: center;
`

export const MessageStyled = styled(Message)`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

export const TagStyled = styled(Tag)`
  
`