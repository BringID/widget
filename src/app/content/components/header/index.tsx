import { FC } from 'react'
import {
  Header,
  AddressText,
  AddressIcon,
  CloseButtonStyled
} from './styled-components'
import TProps from './types'
import { shortenString } from '@/utils'
import { useModal } from '../../store/reducers/modal';
import { request } from 'http';

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
  const modal = useModal()
  return <Header>
    {defineContent(
      address,
      userKey
    )}
    <CloseButtonStyled
      onClick={() => {
        window.postMessage({
          type: 'CLOSE_MODAL',
          requestId: modal.requestId
        }, window.location.origin)
      }}
    />
  </Header>
};

export default HeaderComponent;
