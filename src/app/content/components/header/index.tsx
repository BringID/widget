import { FC } from 'react'
import {
  Header,
  AddressText,
  AddressIcon,
  LogoutIconStyled,
  CloseButtonStyled
} from './styled-components'
import TProps from './types'
import { shortenString } from '@/utils'
const defineContent = (
  address: string | null,
  userKey: string | null,
  onLogout?: () => void
) => {

  if (!address || !userKey) {
    return null
  }

  return (
    <>
      <AddressIcon /> <AddressText>{shortenString(address)}</AddressText>
      {onLogout && <LogoutIconStyled onClick={onLogout} />}
    </>
  );
};

const HeaderComponent: FC<TProps> = ({
  address,
  userKey,
  onLogout
}) => {
  return <Header>
    {defineContent(
      address,
      userKey,
      onLogout
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
