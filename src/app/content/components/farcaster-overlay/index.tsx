'use client'
import { FC, useState, useEffect, useRef, useCallback } from 'react'
import { createAppClient, viemConnector } from '@farcaster/auth-client'
import { messageSignerApi } from '../../api'
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
const SIWE_URI = process.env.NEXT_PUBLIC_FARCASTER_SIWE_URI || 'https://widget.bringid.org'
const POLL_INTERVAL_MS = 1500

function generateNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('')
}

const isMobileDevice = () =>
  typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

const FarcasterOverlay: FC<TProps> = ({ task, isMiniApp, onComplete, onError, onClose }) => {
  const [connecting, setConnecting] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [waiting, setWaiting] = useState(false)
  const [url, setUrl] = useState<string | null>(null)

  const nonceRef = useRef(generateNonce())
  const channelTokenRef = useRef<string | null>(null)
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const preOpenedWindowRef = useRef<Window | null>(null)
  const isMobile = isMobileDevice() || isMiniApp

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
            const win = preOpenedWindowRef.current
            if (win && !win.closed) {
              // Navigate to our own page so window.close() works reliably
              // (direct cross-origin close is unreliable on mobile browsers)
              win.location.href = window.location.origin + '/verification-finished'
            }
            preOpenedWindowRef.current = null
            setProcessing(true)

            try {
              const { message: scoreMessage, signature: scoreSignature } = await messageSignerApi.signFarcaster(
                task.messageSignerUrl!,
                data.message,
                data.signature,
                nonceRef.current,
                window.location.hostname,
              )
              onComplete({ message: scoreMessage, signature: scoreSignature })
            } catch (err) {
              onError(err instanceof Error ? err.message : 'Unknown error')
            } finally {
              setProcessing(false)
            }
          }
        } catch (err) {
          stopPolling()
          preOpenedWindowRef.current?.close()
          preOpenedWindowRef.current = null
          onError(err instanceof Error ? err.message : 'Polling failed')
        }

      }, POLL_INTERVAL_MS)
    },
    [stopPolling, onComplete, onError]
  )

  const handleStart = useCallback(async () => {
    setConnecting(true)

    // Open a blank window synchronously during the user gesture so the browser
    // doesn't block it. We'll navigate it to the Farcaster URL once we have it.
    const preOpenedWindow = isMobile && !isMiniApp ? window.open('', '_blank') : null
    preOpenedWindowRef.current = preOpenedWindow

    try {
      const res = await appClient.current.createChannel({
        siweUri: SIWE_URI,
        domain: window.location.hostname,
        nonce: nonceRef.current,
      })

      if (res.isError || !res.data) {
        preOpenedWindow?.close()
        onError(res.error?.message || 'Failed to connect')
        return
      }

      const { channelToken, url: connectUrl } = res.data
      channelTokenRef.current = channelToken
      setUrl(connectUrl)

      if (isMobile) {
        if (isMiniApp) {
          window.postMessage({ type: 'OPEN_EXTERNAL_URL', payload: { url: connectUrl } }, window.location.origin)
        } else if (preOpenedWindow) {
          preOpenedWindow.location.href = connectUrl
        }
        setWaiting(true)
      }

      startPolling(channelToken)
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Connection failed')
    } finally {
      setConnecting(false)
    }
  }, [isMobile, isMiniApp, startPolling, onError])

  const renderBody = () => {
    if (processing || waiting) return <SpinnerStyled size="large" />

    if (!url) {
      return (
        <ButtonStyled appearance="action" loading={connecting} onClick={handleStart}>
          Connect Farcaster
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
