import React, { FC } from 'react';
import styled from 'styled-components';

type TProps = {
  className?: string;
};

const Svg = styled.svg`
  width: 16px;
  height: 16px;
  color: ${(props) => props.theme.backgroundColor};
`;

const KeyIcon: FC<TProps> = ({ className }) => {
  return (
    <Svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18.5998 4.05002C19.2932 3.40691 20.204 3.04956 21.1498 3.04956C22.0955 3.04956 23.0063 3.40691 23.6998 4.05002L31.9498 12.3C32.5929 12.9934 32.9502 13.9043 32.9502 14.85C32.9502 15.7958 32.5929 16.7066 31.9498 17.4L26.3998 22.95C25.7063 23.5931 24.7955 23.9505 23.8498 23.9505C22.904 23.9505 21.9932 23.5931 21.2998 22.95L13.0498 14.7C12.4067 14.0066 12.0493 13.0958 12.0493 12.15C12.0493 11.2043 12.4067 10.2934 13.0498 9.60002L18.5998 4.05002Z" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M21 10.5L25.5 15" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M14.1 15.9L3.879 26.121C3.31635 26.6835 3.00017 27.4464 3 28.242V31.5C3 31.8978 3.15804 32.2794 3.43934 32.5607C3.72064 32.842 4.10218 33 4.5 33H9C9.39782 33 9.77935 32.842 10.0607 32.5607C10.342 32.2794 10.5 31.8978 10.5 31.5V30C10.5 29.6022 10.658 29.2207 10.9393 28.9394C11.2206 28.6581 11.6022 28.5 12 28.5H13.5C13.8978 28.5 14.2794 28.342 14.5607 28.0607C14.842 27.7794 15 27.3978 15 27V25.5C15 25.1022 15.158 24.7207 15.4393 24.4394C15.7206 24.1581 16.1022 24 16.5 24H16.758C17.5536 23.9999 18.3165 23.6837 18.879 23.121L20.1 21.9" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    </Svg>
  );
};

export default KeyIcon;
