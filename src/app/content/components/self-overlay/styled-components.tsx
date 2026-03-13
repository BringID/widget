import styled from 'styled-components'
import { Title, Text, Button, Spinner } from '@/components/common'

export const Container = styled.div`
  position: fixed;
  inset: 0;
  z-index: 10;
  background-color: ${(props) => props.theme.primaryBackgroundColor};
  padding: 12px;
`

export const Content = styled.div`
  padding: 24px;
  border-radius: 8px;
  border: 1px solid ${(props) => props.theme.primaryBorderColor};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
`

export const TitleStyled = styled(Title)`
  text-align: center;
  font-size: 24px;
  margin: 0;
`

export const DescriptionStyled = styled(Text)`
  text-align: center;
  margin: 0;
`

export const ButtonStyled = styled(Button)`
  width: 100%;
`

export const SpinnerStyled = styled(Spinner)`
  margin: 0 auto;
`

export const QRWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`

export const QRHint = styled(Text)`
  text-align: center;
  font-size: 12px;
  opacity: 0.7;
  margin: 0;
`
