import React, { FC } from 'react';
import {
  Container,
  TitleStyled,
  Content,
  TextStyled,
  ButtonStyled
} from './styled-components';
import { Link } from '@/components/common';
import TProps from './types';

const defineErrorTitle = (
  errorText: string
) => {
  switch (errorText) {
    case 'TASK_ALREADY_EXISTS_WITH_ANOTHER_IDENTITY_COMMITMENT':
      return 'Task failed'
    case 'POPUP_CLOSED':
      return 'Popup was accidentally closed'
    case 'MEMBER_NOT_FOUND_WHILE_FETCHING_PROOFS':
      return 'Proof data is not ready yet'
    case 'SESSION_LOST':
      return 'Session expired'
    default:
      return 'Some error occured'
  }
}

const defineErrorText = (
  errorText: string
) => {
  switch (errorText) {
    case 'TASK_ALREADY_EXISTS_WITH_ANOTHER_IDENTITY_COMMITMENT':
      return <>Please send an email to <Link target="_blank" href="mailto:dev@bringid.org">dev@bringid.org</Link> to unlink your account from current identity</>
    case 'POPUP_CLOSED':
      return 'Please, do not close the window while OAuth process'
    case 'MEMBER_NOT_FOUND_WHILE_FETCHING_PROOFS':
      return <>Try again in a few minutes. If the error persists, please contact <Link target="_blank" href="mailto:dev@bringid.org">dev@bringid.org</Link></>
    case 'SESSION_LOST':
      return 'The connection was lost. Please close this popup and open it again.'
    default:
      return <>Please contact <Link target="_blank" href="mailto:dev@bringid.org">dev@bringid.org</Link> to define an actual reason: {errorText}</>
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
