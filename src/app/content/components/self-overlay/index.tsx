'use client'
import { FC, useState, useEffect, useRef, useCallback } from 'react'
import { useTheme } from 'styled-components'
import { SelfAppBuilder, type SelfApp } from '@selfxyz/qrcode'
import { REDIRECT_URL, WS_DB_RELAYER } from '@selfxyz/common'
import { io, type Socket } from 'socket.io-client'
import { v4 as uuidv4 } from 'uuid'
import QRCode from 'react-qr-code'
import {
  Container,
  Content,
  TitleStyled,
  DescriptionStyled,
  ButtonStyled,
  SpinnerStyled,
  QRWrapper,
  QRContainer,
  QRHint,
} from './styled-components'
import { TProps, TSelfCompleteData } from './types'
import { TSelfEndpointType } from '@/types'
import { api } from '@/utils'
import isMobileDevice from '@/utils/is-mobile-device'

const APP_NAME = process.env.NEXT_PUBLIC_SELF_APP_NAME || 'BringID'
const SCOPE = process.env.NEXT_PUBLIC_SELF_SCOPE || 'bringid-verification'
const ENDPOINT_TYPE = (process.env.NEXT_PUBLIC_SELF_ENDPOINT_TYPE || 'https') as TSelfEndpointType

const SelfOverlay: FC<TProps> = ({ task, isMiniApp, onComplete, onError, onClose }) => {
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null)
  const [sessionId] = useState(() => uuidv4())
  const [socketReady, setSocketReady] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const resultRequestInFlightRef = useRef(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const urlOpenedRef = useRef(false)
  const isMobile = isMobileDevice() || isMiniApp
  const theme = useTheme()

  const signerUrl = task.messageSignerUrl!
  const qrUrl = `${REDIRECT_URL}?sessionId=${sessionId}`

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  const fetchResult = useCallback(async () => {
    if (resultRequestInFlightRef.current) return
    resultRequestInFlightRef.current = true
    stopPolling()
    setProcessing(true)

    try {
      const { message, signature } = await api<TSelfCompleteData>(
        `${signerUrl}/get-result`,
        'GET',
        { Authorization: `Bearer ${process.env.NEXT_PUBLIC_ZUPLO_API_KEY}` },
        {},
        'include'
      )
      onComplete({ message, signature })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to get result'
      console.error('[self] fetchResult error:', msg)
      onError(msg)
    } finally {
      resultRequestInFlightRef.current = false
      setProcessing(false)
    }
  }, [signerUrl, onComplete, onError, stopPolling])

  const startPolling = useCallback(() => {
    if (pollingRef.current) return
    pollingRef.current = setInterval(async () => {
      if (resultRequestInFlightRef.current) return
      resultRequestInFlightRef.current = true
      try {
        const { message, signature } = await api<TSelfCompleteData>(
          `${signerUrl}/get-result`,
          'GET',
          { Authorization: `Bearer ${process.env.NEXT_PUBLIC_ZUPLO_API_KEY}` },
          {},
          'include'
        )
        stopPolling()
        setProcessing(true)
        onComplete({ message, signature })
      } catch {
        // Result not ready yet, continue polling
      } finally {
        resultRequestInFlightRef.current = false
      }
    }, 3000)
  }, [signerUrl, onComplete, stopPolling])

  useEffect(() => {
    const init = async () => {
      try {
        const { userId } = await api<{ userId: string }>(
          `${signerUrl}/init-session`,
          'GET',
          { Authorization: `Bearer ${process.env.NEXT_PUBLIC_ZUPLO_API_KEY}` },
          {},
          'include'
        )

        const app = new SelfAppBuilder({
          version: 2,
          appName: APP_NAME,
          scope: SCOPE,
          endpoint: `${signerUrl}/verify`,
          endpointType: ENDPOINT_TYPE,
          userId,
          userIdType: 'hex',
          disclosures: {},
        }).build()

        setSelfApp(app)
        setLoading(false)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to initialize'
        console.error('[self] init-session error:', msg)
        onError(msg)
        setLoading(false)
      }
    }

    init()

    return () => stopPolling()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selfApp) return

    const socket: Socket = io(`${WS_DB_RELAYER}/websocket`, {
      path: '/',
      query: { sessionId, clientType: 'web' },
      transports: ['websocket'],
    })

    socketRef.current = socket
    let isFirstConnect = true

    socket.on('connect', () => {
      setSocketReady(true)
      if (!isFirstConnect) {
        console.log('[self] socket reconnected → re-emitting self_app')
      }
      socket.emit('self_app', { ...selfApp, sessionId })
      isFirstConnect = false
    })

    socket.on('disconnect', () => {
      setSocketReady(false)
    })

    socket.on('mobile_status', (data: { status?: string; error_code?: string; reason?: string }) => {
      switch (data.status) {
        case 'mobile_connected':
          socket.emit('self_app', { ...selfApp, sessionId })
          break
        case 'proof_verified':
          fetchResult()
          break
        case 'proof_generation_failed':
          onError(data.reason || data.error_code || 'Proof generation failed')
          break
      }
    })

    socket.on('connect_error', (err) => {
      console.error('[self] socket connect_error:', err.message)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [selfApp]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && urlOpenedRef.current && !resultRequestInFlightRef.current) {
        resultRequestInFlightRef.current = true
        api<TSelfCompleteData>(
          `${signerUrl}/get-result`,
          'GET',
          { Authorization: `Bearer ${process.env.NEXT_PUBLIC_ZUPLO_API_KEY}` },
          {},
          'include'
        ).then(({ message, signature }) => {
          stopPolling()
          setProcessing(true)
          onComplete({ message, signature })
        }).catch(() => {
          // Not ready yet, polling will catch it
        }).finally(() => {
          resultRequestInFlightRef.current = false
        })
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [signerUrl, onComplete, stopPolling]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpenUrl = () => {
    if (isMiniApp) {
      window.postMessage({ type: 'OPEN_EXTERNAL_URL', payload: { url: qrUrl } }, window.location.origin)
    } else {
      window.open(qrUrl, '_blank')
    }
    urlOpenedRef.current = true
    startPolling()
  }

  const renderBody = () => {
    if (loading || processing) return <SpinnerStyled size="large" />

    if (isMobile) {
      return (
        <ButtonStyled appearance="action" onClick={handleOpenUrl} disabled={!socketReady}>
          {socketReady ? 'Open Self app' : 'Connecting...'}
        </ButtonStyled>
      )
    }

    return (
      <QRWrapper>
        <QRContainer>
          <QRCode value={qrUrl} size={180} fgColor={theme.highlightColor} bgColor="transparent" />
        </QRContainer>
        <QRHint>Scan with Self app</QRHint>
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

export default SelfOverlay
