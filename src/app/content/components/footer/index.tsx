import { FC } from 'react'
import {
  Footer,
  TextStyled,
  TitleStyled,
  Content,
  Texts
} from './styled-components'
import TProps from './types'

const defineContent = (
  address: string | null,
  points: number,
  userKey: string | null,
  children?: React.ReactNode | React.ReactNode[]
) => {

  if (!address || !userKey) {
    return <TitleStyled>
      Powered by BringID
    </TitleStyled>
  }

  return (
    <Content>
      <Texts>
        <TextStyled>Total Bring Score: {points}</TextStyled>
      </Texts>
      {children}
    </Content>
  );
};

const FooterComponent: FC<TProps> = ({
  points,
  address,
  userKey,
  children
}) => {
  return <Footer>
    {defineContent(
      address,
      points,
      userKey,
      children
    )}
  </Footer>
};

export default FooterComponent
