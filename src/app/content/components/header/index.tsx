import { FC } from 'react'
import {
  Header,
  TextStyled,
  AddressText,
  TitleStyled,
  Content,
  Texts,
  Address,
} from './styled-components'
import TProps from './types'
import { shortenString } from '@/utils'
import Icons from '@/components/common/icons'

const defineContent = (
  address: string | null,
  points: number,
  userKey: string | null
) => {

  if (!address || !userKey) {
    return <TitleStyled>BringID</TitleStyled>
  }


  return (
    <Content>
      <Texts>
        <Address>
          <Icons.AddressIcon /> <AddressText>{shortenString(address)}</AddressText>
        </Address>
        <TextStyled>Total Bring Score: {points}</TextStyled>
      </Texts>
    </Content>
  );
};

const HeaderComponent: FC<TProps> = ({
  points,
  address,
  userKey
}) => {
  return <Header>
    {defineContent(
      address,
      points,
      userKey
    )}
  </Header>
};

export default HeaderComponent;
