import styled from 'styled-components';
import { Text } from '@/components/common';

export const TitleStyled = styled(Text)`
  font-size: 15px;
  font-weight: 400;
  text-align: center;
  width: 100%;
`;

export const Footer = styled.footer`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px;
  border-top: 1px solid ${(props) => props.theme.primaryBorderColor};
`;

export const UserStatus = styled.span`
  color: ${(props) => props.theme.successStatusTextColor};
  text-transform: capitalize;
`;

export const Content = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
`;

export const Texts = styled.div``;

export const Address = styled.div`
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${(props) => props.theme.secondaryTextColor};
`;

export const AddressText = styled.span`
  color: ${(props) => props.theme.primaryTextColor};
  font-weight: 700;
`;

export const TextStyled = styled(Text)`
  font-size: 15px;
  width: 100%;
  color: ${props => props.theme.secondaryTextColor};
`;
