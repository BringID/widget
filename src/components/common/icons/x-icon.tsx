import React, { FC } from 'react';
import styled from 'styled-components';

type TProps = {
  className?: string;
};

const Svg = styled.svg`
  width: 24px;
  height: 22px;
`;

const XIcon: FC<TProps> = ({ className }) => {
  return (
    <Svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="22"
      viewBox="0 0 24 22"
      fill="none"
    >
      <g clip-path="url(#clip0_16_2)">
        <path d="M18.9024 0H22.5816L14.5416 9.31939L24 22H16.5936L10.7928 14.3089L4.1568 22H0.4728L9.072 12.0332L0 0H7.5936L12.8376 7.0291L18.9024 0ZM17.6088 19.7657H19.6488L6.4848 2.11749H4.296L17.6088 19.7657Z" fill="#000001"/>
        </g>
        <defs>
        <clipPath id="clip0_16_2">
        <rect width="24" height="22" fill="white"/>
        </clipPath>
      </defs>
    </Svg>
  );
};

export default XIcon
