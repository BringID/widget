import styled from 'styled-components';
import {
  Text,
  Icons,
  Link
 } from '@/components/common';

export const TitleStyled = styled(Text)`
  font-size: 15px;
  font-weight: 400;
  text-align: center;
  width: 100%;
`;

export const LinkStyled = styled(Link)`
  display: flex;
  gap: 4px;
  font-size: 15px;
  font-weight: 400;
  color: ${props => props.theme.secondaryTextColor};
  align-items: center;
  justify-content: center;
`

export const ProfileIcon = styled(Icons.ProfileIcon)`
  max-width: 16px;
`

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
  justify-content: space-between;
`;

export const Texts = styled.div``;

export const TextStyled = styled(Text)`
  font-size: 15px;
  width: 100%;
  color: ${props => props.theme.secondaryTextColor};
`;
