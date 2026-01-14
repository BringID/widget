import React, { FC } from 'react';
import styled from 'styled-components';

type TProps = {
  className?: string;
};

const Svg = styled.svg`
  width: 16px;
  height: 16px;
`;

const ProfileIcon: FC<TProps> = ({ className }) => {
  return (
    <Svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6.66667 7.33333C8.13943 7.33333 9.33333 6.13943 9.33333 4.66667C9.33333 3.19391 8.13943 2 6.66667 2C5.19391 2 4 3.19391 4 4.66667C4 6.13943 5.19391 7.33333 6.66667 7.33333Z" stroke="#657081" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M6.86667 10H4.66667C3.95942 10 3.28115 10.281 2.78105 10.781C2.28095 11.2811 2 11.9594 2 12.6667V14" stroke="#657081" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M10 10.3333V9.33333C10 8.97971 10.1405 8.64057 10.3905 8.39052C10.6406 8.14048 10.9797 8 11.3333 8C11.687 8 12.0261 8.14048 12.2761 8.39052C12.5262 8.64057 12.6667 8.97971 12.6667 9.33333V10.3333" stroke="#657081" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M13.4005 10.6666H9.26584C8.93483 10.6666 8.6665 10.935 8.6665 11.266V13.4006C8.6665 13.7316 8.93483 14 9.26584 14H13.4005C13.7315 14 13.9998 13.7316 13.9998 13.4006V11.266C13.9998 10.935 13.7315 10.6666 13.4005 10.6666Z" stroke="#657081" stroke-linecap="round" stroke-linejoin="round"/>
    </Svg>
  );
};

export default ProfileIcon
