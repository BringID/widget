import styled from 'styled-components';
import { Text, CloseButton } from '@/components/common';
import { Icons } from '@/components/common';

export const Header = styled.header`
  display: flex;
  position: relative;
  align-items: center;
  justify-content: center;
  padding: 28px 0 12px;
`;

export const AddressText = styled(Text)`
  font-size: 13px;
  color: ${(props) => props.theme.secondaryTextColor};
`;

export const AddressIcon = styled(Icons.AddressIcon)`
  max-width: 16px;
  margin-right: 4px;
`

export const CloseButtonStyled = styled(CloseButton)`
  position: absolute;
  right: 20px;
  bottom: 20px;
`