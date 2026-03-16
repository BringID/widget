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

const APP_NAME = process.env.NEXT_PUBLIC_SELF_APP_NAME || 'BringID'
const SCOPE = process.env.NEXT_PUBLIC_SELF_SCOPE || 'bringid-verification'
const ENDPOINT_TYPE = (process.env.NEXT_PUBLIC_SELF_ENDPOINT_TYPE || 'https') as TSelfEndpointType

const isMobileDevice = () =>
  typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

const SelfOverlay: FC<TProps> = ({ task, isMiniApp, onComplete, onError, onClose }) => {
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null)
  const [sessionId] = useState(() => uuidv4())
  const [logs, setLogs] = useState<string[]>([])
  const socketRef = useRef<Socket | null>(null)
  const resultRequestInFlightRef = useRef(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const urlOpenedRef = useRef(false)
  const userIdRef = useRef<string | null>(null)
  const isMobile = isMobileDevice() || isMiniApp
  const theme = useTheme()

  const signerUrl = task.messageSignerUrl!
  const qrUrl = `${REDIRECT_URL}?sessionId=${sessionId}`

  const addLog = (msg: string) => setLogs(prev => [...prev, msg])

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  const getResultUrl = useCallback(() => {
    const uid = userIdRef.current
    return uid ? `${signerUrl}/get-result?userId=${uid}` : `${signerUrl}/get-result`
  }, [signerUrl])

  const fetchResult = useCallback(async () => {
    if (resultRequestInFlightRef.current) return
    resultRequestInFlightRef.current = true
    stopPolling()
    setProcessing(true)
    addLog('[self] fetchResult called')

    try {
      const { message, signature } = await api<TSelfCompleteData>(
        getResultUrl(),
        'GET',
        { Authorization: `Bearer ${process.env.NEXT_PUBLIC_ZUPLO_API_KEY}` },
        {},
        'include'
      )
      addLog('[self] fetchResult OK')
      onComplete({ message, signature })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to get result'
      addLog(`[self] fetchResult error: ${msg}`)
      onError(msg)
    } finally {
      resultRequestInFlightRef.current = false
      setProcessing(false)
    }
  }, [signerUrl, onComplete, onError, stopPolling, getResultUrl])

  const startPolling = useCallback(() => {
    if (pollingRef.current) return
    addLog('[self] starting result polling')
    pollingRef.current = setInterval(async () => {
      if (resultRequestInFlightRef.current) return
      resultRequestInFlightRef.current = true
      try {
        const { message, signature } = await api<TSelfCompleteData>(
          getResultUrl(),
          'GET',
          { Authorization: `Bearer ${process.env.NEXT_PUBLIC_ZUPLO_API_KEY}` },
          {},
          'include'
        )
        addLog('[self] poll: result found')
        stopPolling()
        setProcessing(true)
        onComplete({ message, signature })
      } catch (err) {
        addLog(`[self] poll: not ready (${err instanceof Error ? err.message : 'error'})`)
      } finally {
        resultRequestInFlightRef.current = false
      }
    }, 3000)
  }, [signerUrl, onComplete, stopPolling, getResultUrl])

  useEffect(() => {
    addLog(`[self] mount sessionId=${sessionId}`)
    addLog(`[self] qrUrl=${qrUrl}`)
    addLog(`[self] signerUrl=${signerUrl}`)
    addLog(`[self] isMiniApp=${isMiniApp} isMobile=${isMobile}`)

    const init = async () => {
      try {
        addLog('[self] calling init-session...')
        const { userId } = await api<{ userId: string }>(
          `${signerUrl}/init-session`,
          'GET',
          { Authorization: `Bearer ${process.env.NEXT_PUBLIC_ZUPLO_API_KEY}` },
          {},
          'include'
        )
        addLog(`[self] init-session OK userId=${userId}`)
        userIdRef.current = userId

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

        addLog(`[self] SelfApp built scope=${SCOPE} endpointType=${ENDPOINT_TYPE}`)
        setSelfApp(app)
        setLoading(false)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to initialize'
        addLog(`[self] init-session error: ${msg}`)
        onError(msg)
        setLoading(false)
      }
    }

    init()

    return () => stopPolling()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selfApp) return

    addLog(`[self] connecting socket to ${WS_DB_RELAYER}/websocket sessionId=${sessionId}`)

    const socket: Socket = io(`${WS_DB_RELAYER}/websocket`, {
      path: '/',
      query: { sessionId, clientType: 'web' },
      transports: ['websocket'],
    })

    socketRef.current = socket
    let isFirstConnect = true

    socket.on('connect', () => {
      addLog(`[socket] connected id=${socket.id}`)
      if (!isFirstConnect) {
        addLog('[socket] reconnected → re-emitting self_app')
        socket.emit('self_app', { ...selfApp, sessionId })
      }
      isFirstConnect = false
    })

    socket.on('disconnect', (reason) => {
      addLog(`[socket] disconnected reason=${reason}`)
    })

    socket.on('mobile_status', (data: { status?: string; error_code?: string; reason?: string }) => {
      addLog(`[socket] mobile_status status=${data.status} error_code=${data.error_code ?? '-'} reason=${data.reason ?? '-'}`)
      switch (data.status) {
        case 'mobile_connected':
          addLog('[socket] mobile_connected → emitting self_app')
          socket.emit('self_app', { ...selfApp, sessionId })
          break
        case 'proof_verified':
          addLog('[socket] proof_verified → fetching result')
          fetchResult()
          break
        case 'proof_generation_failed':
          addLog(`[socket] proof_generation_failed`)
          onError(data.reason || data.error_code || 'Proof generation failed')
          break
        default:
          addLog(`[socket] unknown status=${data.status}`)
      }
    })

    socket.on('connect_error', (err) => {
      addLog(`[socket] connect_error: ${err.message}`)
      // Don't call onError here — socket.io will auto-retry
    })

    return () => {
      addLog('[socket] disconnecting')
      socket.disconnect()
      socketRef.current = null
    }
  }, [selfApp]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && urlOpenedRef.current && !resultRequestInFlightRef.current) {
        addLog('[self] page visible after url open → checking result')
        resultRequestInFlightRef.current = true
        api<TSelfCompleteData>(
          getResultUrl(),
          'GET',
          { Authorization: `Bearer ${process.env.NEXT_PUBLIC_ZUPLO_API_KEY}` },
          {},
          'include'
        ).then(({ message, signature }) => {
          addLog('[self] visibility check: result found')
          stopPolling()
          setProcessing(true)
          onComplete({ message, signature })
        }).catch((err) => {
          addLog(`[self] visibility check: not ready (${err instanceof Error ? err.message : 'error'})`)
          // Not ready yet, polling will catch it
        }).finally(() => {
          resultRequestInFlightRef.current = false
        })
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [signerUrl, onComplete, stopPolling, getResultUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpenUrl = () => {
    addLog(`[self] opening url isMiniApp=${isMiniApp}`)
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
        <ButtonStyled appearance="action" onClick={handleOpenUrl}>
          Open Self app
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
      {logs.length > 0 && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '150px',
          background: 'rgba(0,0,0,0.92)',
          color: '#0f0',
          fontSize: '10px',
          fontFamily: 'monospace',
          padding: '6px',
          zIndex: 9999,
          overflowY: 'auto',
          wordBreak: 'break-all',
          whiteSpace: 'pre-wrap',
        }}>
          {logs.map((log, i) => <div key={i}>{log}</div>)}
        </div>
      )}
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
