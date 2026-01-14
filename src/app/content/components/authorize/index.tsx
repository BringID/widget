'use client'
import React, { FC } from 'react';
import TProps from './types';
import {
  Container,
  Title,
  ButtonsStyled,
  IconContainer,
  KeyIcon,
  ButtonInvisible
} from './styled-components'
import { getZKTLSSemaphoreData } from '@/utils';


const Authorize: FC<TProps> = ({ className }) => {
  
  return (
    <Container className={className}>

      <IconContainer>
        <KeyIcon />
      </IconContainer>
      <Title>Create your private key to start verification</Title>

      <ButtonsStyled
        appearance='action'
        onClick={async() => {
          window.postMessage({
            type: 'GENERATE_USER_KEY',
            payload: {
              message: `Sign to derive your BringID key.
Recoverable by re-signing with the same wallet.`
            }
          }, window.location.origin)
        }}
      >
        Create BringID key
      </ButtonsStyled>

      <ButtonInvisible
        onClick={async () => {
          
          const data = await getZKTLSSemaphoreData(
            {
              "id": "4",
              "title": "Apple Devices",
              "service": "Apple ID",
              "description": "Prove you own an Apple device",
              "icon": "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
              "permissionUrl": ["https://appleid.apple.com/account/manage/security/devices", "https://account.apple.com/account/manage/section/devices"],
              "groups": [
                {
                  "points": 10,
                  "semaphoreGroupId": "72",
                  "credentialGroupId": "5"
                }
              ],
              "steps": [
                {
                  "text": "Visit website"
                },
                {
                  "text": "Wait for request capture"
                },
                {
                  "text": "MPC-TLS verification progress",
                  "notarization": true
                }
              ]
            },
            '0x202002022',
            '0xFEA4133236B093eC727286473286A45c5d4443BC',
            'dev'
          )

          console.log({ data })
        }}
      ></ButtonInvisible>


    </Container>
  );
};

export default Authorize;
