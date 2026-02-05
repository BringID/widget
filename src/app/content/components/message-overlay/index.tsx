import React, { FC } from 'react';
import {
  Container,
  TitleStyled,
  Content,
  TextStyled,
  ButtonStyled,
  ButtonsContainer
} from './styled-components'
import { Link } from '@/components/common'
import TProps from './types'
import configs from '@/app/configs'
import { InstallExtensionButton } from './components'


const defineMessageTitle = (
  errorText: string
) => {
  switch (errorText) {
    case 'EXTENSION_IS_NOT_INSTALLED':
      return 'Install BringID Extension'

    case 'NOT_ENOUGH_SCORE':
      return 'Not enough score'
    
    default:
      return null
  }  
}

const defineMessageText = (
  errorText: string
) => {
  switch (errorText) {
    case 'EXTENSION_IS_NOT_INSTALLED':
      return <>You need to install the <Link href={configs.EXTENSION_URL} target='_blank'>extension</Link> to verify with zkTLS. After the installation please reload the widget, and sign in again. Reload is necessary to make sure that widget can communicate with the extension</> 
    
    case 'NOT_ENOUGH_SCORE':
      return <>Unfortunately the score of your verified account is too low. Please make sure that there is enough activity to get points</>

    default:
      return null
  }  
}

const defineMessageAction = (
  errorText: string
) => {
  switch (errorText) {
    case 'EXTENSION_IS_NOT_INSTALLED':
      return <InstallExtensionButton />
      
    case 'NOT_ENOUGH_SCORE':
      return null
    
    default:
      return null
  }  
}

const MessageOverlay: FC<TProps> = ({
  message,
  onClose
}) => {
  return (
    <Container>
      <Content>
        <TitleStyled>{defineMessageTitle(message)}</TitleStyled>
        <TextStyled>{defineMessageText(message)}</TextStyled>

        <ButtonsContainer>
          {defineMessageAction(message)}
          <ButtonStyled
            onClick={onClose}
          >
            Return
          </ButtonStyled>
        </ButtonsContainer>
        
      </Content>
    </Container>
  );
};

export default MessageOverlay
