'use client'
import { FC, useState, useEffect, useMemo, useCallback } from 'react'
import { AuthKitProvider, useSignIn, QRCode } from '@farcaster/auth-kit'
import {
  Container,
  Content,
  TitleStyled,
  DescriptionStyled,
  ButtonStyled,
  SpinnerStyled,
  QRWrapper,
  QRHint,
} from './styled-components'
import { TProps } from './types'

function generateNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('')
}

const authConfig = {
  relay: process.env.NEXT_PUBLIC_FARCASTER_RELAY || 'https://relay.farcaster.xyz',
  rpcUrl: process.env.NEXT_PUBLIC_FARCASTER_RPC_URL || 'https://mainnet.optimism.io',
  domain: process.env.NEXT_PUBLIC_FARCASTER_DOMAIN || 'widget.bringid.org',
  siweUri: process.env.NEXT_PUBLIC_FARCASTER_SIWE_URI || 'https://widget.bringid.org',
}

const isMobileDevice = () =>
  typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

const FarcasterSignIn: FC<TProps> = ({ task, onComplete, onError, onClose }) => {
  const nonce = useMemo(() => generateNonce(), [])
  const [connecting, setConnecting] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [processed, setProcessed] = useState(false)
  const isMobile = isMobileDevice()

  const { connect, url, isSuccess, data } = useSignIn({
    nonce,
    onError: (err) => {
      setConnecting(false)
      onError(err?.message || 'Authentication failed')
    },
  })

  const handleStart = useCallback(async () => {
    setConnecting(true)
    await connect()
  }, [connect])

  // On mobile, open the Farcaster app URL as soon as we have it
  useEffect(() => {
    if (isMobile && url && !processed) {
      window.open(url, '_blank')
    }
  }, [isMobile, url, processed])

  // After successful sign-in, call the sign-score API
  useEffect(() => {
    if (!isSuccess || processed || !data?.message || !data?.signature) return
    setProcessed(true)
    setProcessing(true)

    ;(async () => {
      try {
        const res = await fetch('/api/farcaster/sign-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: data.message, signature: data.signature, nonce }),
        })

        if (!res.ok) {
          const errData = await res.json()
          throw new Error(errData.error || 'Failed to sign score')
        }

        const { message: scoreMessage, signature: scoreSignature } = await res.json()
        onComplete({ message: scoreMessage, signature: scoreSignature })
      } catch (err) {
        onError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setProcessing(false)
      }
    })()
  }, [isSuccess, data, processed, nonce, onComplete, onError])

  const renderBody = () => {
    if (processing) return <SpinnerStyled size="large" />

    if (!url) {
      return (
        <ButtonStyled appearance="action" loading={connecting} onClick={handleStart}>
          Connect Farcaster
        </ButtonStyled>
      )
    }

    if (isMobile) {
      return (
        <ButtonStyled appearance="action" onClick={() => window.open(url, '_blank')}>
          Open Farcaster
        </ButtonStyled>
      )
    }

    return (
      <QRWrapper>
        <QRCode uri={url} />
        <QRHint>Scan with your Farcaster app</QRHint>
      </QRWrapper>
    )
  }

  return (
    <Container>
      <Content>
        <TitleStyled>{task.title}</TitleStyled>
        {task.description && <DescriptionStyled>{task.description}</DescriptionStyled>}
        {renderBody()}
        <ButtonStyled appearance="default" onClick={onClose}>
          Cancel
        </ButtonStyled>
      </Content>
    </Container>
  )
}

const FarcasterOverlay: FC<TProps> = (props) => (
  <AuthKitProvider config={authConfig}>
    <FarcasterSignIn {...props} />
  </AuthKitProvider>
)

export default FarcasterOverlay
