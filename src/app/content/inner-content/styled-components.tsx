import styled, { css } from "styled-components"

import {
  Footer,
  Header
} from '../components' 

export const Container = styled.div`
  position: relative;
  max-width: 400px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  height: 600px;
  margin: auto;
  background-color:${props => props.theme.widgetBackgroundColor};
`

export const Content = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`

export const FooterStyled = styled(Footer)``

export const HeaderStyled = styled(Header)``