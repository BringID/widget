'use client'
import { FC, useState, useEffect, useRef, useCallback } from 'react'
import { createAppClient, viemConnector } from '@farcaster/auth-client'
import QRCode from 'react-qr-code'
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

const RELAY = process.env.NEXT_PUBLIC_FARCASTER_RELAY || 'https://relay.farcaster.xyz'
const DOMAIN = process.env.NEXT_PUBLIC_FARCASTER_DOMAIN || 'widget.bringid.org'
const SIWE_URI = process.env.NEXT_PUBLIC_FARCASTER_SIWE_URI || 'https://widget.bringid.org'
const POLL_INTERVAL_MS = 1500

function generateNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('')
}

const isMobileDevice = () =>
  typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

const FarcasterOverlay: FC<TProps> = ({ task, onComplete, onError, onClose }) => {
  const [connecting, setConnecting] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [url, setUrl] = useState<string | null>(null)

  const nonceRef = useRef(generateNonce())
  const channelTokenRef = useRef<string | null>(null)
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isMobile = isMobileDevice()

  const appClient = useRef(
    createAppClient({
      relay: RELAY,
      ethereum: viemConnector(),
    })
  )

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
  }, [])

  // Clean up polling on unmount
  useEffect(() => () => stopPolling(), [stopPolling])

  const startPolling = useCallback(
    (channelToken: string) => {
      pollIntervalRef.current = setInterval(async () => {
        try {
          const res = await appClient.current.status({ channelToken })

          if (res.isError) {
            stopPolling()
            onError(res.error?.message || 'Authentication failed')
            return
          }

          const data = res.data
          if (data?.state === 'completed' && data.message && data.signature) {
            stopPolling()
            setProcessing(true)

            try {
              const apiRes = await fetch('/api/farcaster/sign-score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  message: data.message,
                  signature: data.signature,
                  nonce: nonceRef.current,
                }),
              })

              if (!apiRes.ok) {
                const errData = await apiRes.json()
                throw new Error(errData.error || 'Failed to sign score')
              }

              const { message: scoreMessage, signature: scoreSignature } = await apiRes.json()
              onComplete({ message: scoreMessage, signature: scoreSignature })
            } catch (err) {
              onError(err instanceof Error ? err.message : 'Unknown error')
            } finally {
              setProcessing(false)
            }
          }
        } catch (err) {
          stopPolling()
          onError(err instanceof Error ? err.message : 'Polling failed')
        }
      }, POLL_INTERVAL_MS)
    },
    [stopPolling, onComplete, onError]
  )

  const handleStart = useCallback(async () => {
    setConnecting(true)
    try {
      const res = await appClient.current.createChannel({
        siweUri: SIWE_URI,
        domain: DOMAIN,
        nonce: nonceRef.current,
      })

      if (res.isError || !res.data) {
        onError(res.error?.message || 'Failed to connect')
        return
      }

      const { channelToken, url: connectUrl } = res.data
      channelTokenRef.current = channelToken
      setUrl(connectUrl)

      if (isMobile) {
        window.open(connectUrl, '_blank')
      }

      startPolling(channelToken)
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Connection failed')
    } finally {
      setConnecting(false)
    }
  }, [isMobile, startPolling, onError])

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
        <QRCode value={url} size={200} />
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

export default FarcasterOverlay
