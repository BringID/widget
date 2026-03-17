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
  const socketEverReadyRef = useRef(false)
  const [logs, setLogs] = useState<string[]>([])
  const addLog = useCallback((msg: string) => setLogs(prev => [...prev, `${new Date().toISOString().slice(11, 23)} ${msg}`]), [])
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
        addLog('poll: result found!')
        stopPolling()
        setProcessing(true)
        onComplete({ message, signature })
      } catch (err) {
        addLog(`poll: ${err instanceof Error ? err.message : 'err'}`)
      } finally {
        resultRequestInFlightRef.current = false
      }
    }, 3000)
  }, [signerUrl, onComplete, stopPolling])

  useEffect(() => {
    addLog(`session=${sessionId.slice(0, 8)} signer=${signerUrl.split('/').pop()}`)
    const init = async () => {
      addLog('init-session...')
      try {
        const { userId } = await api<{ userId: string }>(
          `${signerUrl}/init-session`,
          'GET',
          { Authorization: `Bearer ${process.env.NEXT_PUBLIC_ZUPLO_API_KEY}` },
          {},
          'include'
        )
        addLog(`userId=${userId.slice(0, 10)}...`)

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
        addLog(`init-session ERR: ${msg}`)
        onError(msg)
        setLoading(false)
      }
    }

    init()

    return () => stopPolling()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selfApp) return

    addLog(`socket connecting...`)
    const socket: Socket = io(`${WS_DB_RELAYER}/websocket`, {
      path: '/',
      query: { sessionId, clientType: 'web' },
      transports: ['websocket'],
    })

    socketRef.current = socket
    let isFirstConnect = true

    socket.on('connect', () => {
      addLog(`socket connected id=${socket.id?.slice(0, 8)}`)
      if (!socketEverReadyRef.current) {
        socketEverReadyRef.current = true
        setSocketReady(true)
      }
      socket.emit('self_app', { ...selfApp, sessionId })
      addLog(isFirstConnect ? 'emitted self_app (first)' : 'emitted self_app (reconnect)')
      isFirstConnect = false
    })

    socket.on('disconnect', (reason) => {
      addLog(`socket disconnected: ${reason}`)
    })

    socket.on('mobile_status', (data: { status?: string; error_code?: string; reason?: string }) => {
      addLog(`mobile_status: ${data.status} err=${data.error_code ?? '-'} reason=${data.reason ?? '-'}`)
      switch (data.status) {
        case 'mobile_connected':
          socket.emit('self_app', { ...selfApp, sessionId })
          addLog('mobile_connected → emitted self_app')
          break
        case 'proof_verified':
          addLog('proof_verified → fetchResult')
          fetchResult()
          break
        case 'proof_generation_failed':
          addLog(`proof_generation_failed: ${data.reason || data.error_code}`)
          onError(data.reason || data.error_code || 'Proof generation failed')
          break
        default:
          addLog(`unknown status: ${data.status}`)
      }
    })

    socket.on('connect_error', (err) => {
      addLog(`socket connect_error: ${err.message}`)
    })

    return () => {
      addLog('socket cleanup')
      socket.disconnect()
      socketRef.current = null
    }
  }, [selfApp]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && urlOpenedRef.current && !resultRequestInFlightRef.current) {
        addLog('visible after open → get-result')
        resultRequestInFlightRef.current = true
        api<TSelfCompleteData>(
          `${signerUrl}/get-result`,
          'GET',
          { Authorization: `Bearer ${process.env.NEXT_PUBLIC_ZUPLO_API_KEY}` },
          {},
          'include'
        ).then(({ message, signature }) => {
          addLog('visibility get-result OK')
          stopPolling()
          setProcessing(true)
          onComplete({ message, signature })
        }).catch((err) => {
          addLog(`visibility get-result fail: ${err instanceof Error ? err.message : err}`)
        }).finally(() => {
          resultRequestInFlightRef.current = false
        })
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [signerUrl, onComplete, stopPolling]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpenUrl = () => {
    addLog(`opening url isMiniApp=${isMiniApp}`)
    if (isMiniApp) {
      window.postMessage({ type: 'OPEN_EXTERNAL_URL', payload: { url: qrUrl } }, window.location.origin)
    } else {
      window.open(qrUrl, '_blank')
    }
    urlOpenedRef.current = true
    addLog('polling started')
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
      {logs.length > 0 && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: '160px', background: 'rgba(0,0,0,0.92)', color: '#0f0',
          fontSize: '9px', fontFamily: 'monospace', padding: '4px',
          zIndex: 9999, overflowY: 'auto', wordBreak: 'break-all', whiteSpace: 'pre-wrap',
        }}>
          {logs.map((l, i) => <div key={i}>{l}</div>)}
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
