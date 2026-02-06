import styled, { css } from 'styled-components';

export const Value = styled.div`
  justify-self: end;
  display: flex;
  gap: 4px;
  align-items: center;
  font-size: 12px;
  color: ${props => props.theme.primaryTextColor};
`;

export const PointsCount = styled.div`
  color: ${props => props.theme.highlightColor};
  font-size: 15px;
  font-weight: 500;
`