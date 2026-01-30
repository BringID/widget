import styled, { css } from "styled-components"

import {
  Footer,
  Header
} from '../components' 

export const Container = styled.div`
  position: relative;
  max-width: 400px;
  width: 100%;
  border-radius: 20px;
  height: 100%;
  display: grid;
  grid-template-rows: min-content 1fr;
  margin: auto;
  background-color:${props => props.theme.primaryBackgroundColor};
`

export const Content = styled.div`
  flex: 1;
  display: grid;
  grid-template-rows: 1fr min-content;
`


export const HeaderStyled = styled(Header)``