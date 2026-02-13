import { FC } from 'react'
import {
  Header,
  AddressText,
  AddressIcon,
  CloseButtonStyled
} from './styled-components'
import TProps from './types'
import { shortenString } from '@/utils'
const defineContent = (
  address: string | null,
  userKey: string | null
) => {

  if (!address || !userKey) {
    return null
  }

  return (
    <>
      <AddressIcon /> <AddressText>{shortenString(address)}</AddressText>
    </>
  );
};

const HeaderComponent: FC<TProps> = ({
  address,
  userKey
}) => {
  return <Header>
    {defineContent(
      address,
      userKey
    )}
    <CloseButtonStyled
      onClick={() => {
        window.postMessage({
          type: 'CLOSE_MODAL',
        }, window.location.origin)
      }}
    />
  </Header>
};

export default HeaderComponent;
