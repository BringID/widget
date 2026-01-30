import { FC } from 'react'
import {
  Footer,
  TextStyled,
  TitleStyled,
  Content,
  Texts,
  ProfileIcon,
  LinkStyled
} from './styled-components'
import configs from '@/app/configs';
import TProps from './types'

const defineContent = (
  address: string | null,
  points: number,
  userKey: string | null,
  children?: React.ReactNode | React.ReactNode[]
) => {

  if (!address || !userKey) {
    return <TitleStyled>
      <LinkStyled href={configs.BRINGID_URL} target='_blank'>
        <ProfileIcon />Powered by BringID
      </LinkStyled>
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
  children,
  className
}) => {
  return <Footer className={className}>
    {defineContent(
      address,
      points,
      userKey,
      children
    )}
  </Footer>
};

export default FooterComponent
