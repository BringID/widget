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
  const [stageLogs, setStageLogs] = useState<string[]>([])
  const [fatalError, setFatalError] = useState<string | null>(null)
  const addLog = (msg: string) => setStageLogs(prev => [...prev, msg])
  const failWith = (msg: string) => { addLog(`[error] ${msg}`); setFatalError(msg) }

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
            const msg = res.error?.message || 'Authentication failed'
            failWith(`poll isError: ${msg}`)
            return
          }

          const data = res.data
          addLog(`[poll] state=${data?.state} hasMsg=${!!data?.message} hasSig=${!!data?.signature}`)
          if (data?.state === 'completed' && data.message && data.signature) {
            stopPolling()
            addLog(`[poll] msg type=${typeof data.message} preview=${JSON.stringify(data.message).substring(0, 120)}`)
            addLog('[farcaster] state=completed, closing window')
            const win = preOpenedWindowRef.current
            if (win && !win.closed) {
              win.location.href = window.location.origin + '/verification-finished'
            }
            preOpenedWindowRef.current = null
            setProcessing(true)

            try {
              addLog('[farcaster] calling signFarcaster...')
              const { message: scoreMessage, signature: scoreSignature } = await messageSignerApi.signFarcaster(
                task.messageSignerUrl!,
                data.message,
                data.signature,
                nonceRef.current,
                window.location.hostname,
              )
              addLog('[farcaster] signFarcaster OK')
              onComplete({ message: scoreMessage, signature: scoreSignature })
            } catch (err) {
              const msg = err instanceof Error ? err.message : 'Unknown error'
              failWith(`signFarcaster: ${msg}`)
            } finally {
              setProcessing(false)
            }
          }
        } catch (err) {
          stopPolling()
          preOpenedWindowRef.current?.close()
          preOpenedWindowRef.current = null
          const msg = err instanceof Error ? err.message : 'Polling failed'
          failWith(`polling: ${msg}`)
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
      addLog('[farcaster] createChannel...')
      const res = await appClient.current.createChannel({
        siweUri: window.location.origin,
        domain: window.location.hostname,
        nonce: nonceRef.current,
      })

      if (res.isError || !res.data) {
        const msg = res.error?.message || 'Failed to connect'
        preOpenedWindow?.close()
        failWith(`createChannel: ${msg}`)
        return
      }

      const { channelToken, url: connectUrl } = res.data
      channelTokenRef.current = channelToken
      addLog('[farcaster] channel created, starting poll')
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
      const msg = err instanceof Error ? err.message : 'Connection failed'
      failWith(`handleStart: ${msg}`)
    } finally {
      setConnecting(false)
    }
  }, [isMobile, isMiniApp, startPolling, onError])

  const handleClose = () => {
    if (fatalError) onError(fatalError)
    else onClose()
  }

  const renderBody = () => {
    if (fatalError) return null
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
      {stageLogs.length > 0 && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          background: 'rgba(0,0,0,0.85)',
          color: '#0f0',
          fontSize: '10px',
          fontFamily: 'monospace',
          padding: '6px',
          zIndex: 9999,
          maxHeight: '40%',
          overflowY: 'auto',
        }}>
          {stageLogs.map((log, i) => <div key={i}>{log}</div>)}
        </div>
      )}
      <Content>
        <TitleStyled>{task.title}</TitleStyled>
        {task.description && <DescriptionStyled>{task.description}</DescriptionStyled>}
        {renderBody()}
        <ButtonStyled appearance="default" onClick={handleClose}>
          {fatalError ? 'Close' : 'Cancel'}
        </ButtonStyled>
      </Content>
    </Container>
  )
}

export default FarcasterOverlay
