import React, { FC } from 'react';
import {
  Container,
  TitleStyled,
  Content,
  TextStyled,
  ButtonStyled
} from './styled-components';
import TProps from './types';

const defineErrorTitle = (
  errorText: string
) => {
  switch (errorText) {
    case 'TASK_ALREADY_EXISTS_WITH_ANOTHER_IDENTITY_COMMITMENT':
      return 'Task failed'
    case 'POPUP_CLOSED':
      return 'Popup was accidentally closed'
    default:
      return 'Some error occured'
  }  
}

const defineErrorText = (
  errorText: string
) => {
  switch (errorText) {
    case 'TASK_ALREADY_EXISTS_WITH_ANOTHER_IDENTITY_COMMITMENT':
      return <>Please send email to dev@bringid.org to unlink your account from current identity</>
    case 'POPUP_CLOSED':
      return 'Please, do not close the window while OAuth process'
    default:
      return <>Please contact dev@bringid.org to define an actual reason: {errorText}</>
  }  
}

const ErrorOverlay: FC<TProps> = ({
  errorText,
  onClose
}) => {
  return (
    <Container>
      <Content>
        <TitleStyled>{defineErrorTitle(errorText)}</TitleStyled>
        <TextStyled>{defineErrorText(errorText)}</TextStyled>
        <ButtonStyled
          onClick={onClose}
          appearance='action'
        >
          Return
        </ButtonStyled>
      </Content>
    </Container>
  );
};

export default ErrorOverlay;
