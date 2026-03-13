'use client'
import { FC, useState, useEffect, useRef, useCallback } from 'react'
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
  QRHint,
} from './styled-components'
import { TProps } from './types'
import { TSelfEndpointType } from '@/types'

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
  const socketRef = useRef<Socket | null>(null)
  const resultRequestInFlightRef = useRef(false)
  const isMobile = isMobileDevice() || isMiniApp

  const signerUrl = task.messageSignerUrl!
  const qrUrl = `${REDIRECT_URL}?sessionId=${sessionId}`

  const fetchResult = useCallback(async () => {
    if (resultRequestInFlightRef.current) return
    resultRequestInFlightRef.current = true
    setProcessing(true)

    try {
      const res = await fetch(`${signerUrl}/get-result`, {
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_ZUPLO_API_KEY}`,
        },
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `Failed to get result: ${res.status}`)
      }

      const { message, signature } = await res.json()
      onComplete({ message, signature })
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to get result')
    } finally {
      resultRequestInFlightRef.current = false
      setProcessing(false)
    }
  }, [signerUrl, onComplete, onError])

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch(`${signerUrl}/init-session`, {
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_ZUPLO_API_KEY}`,
          },
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error || 'Failed to initialize session')
        }

        const { userId } = await res.json()

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
        onError(err instanceof Error ? err.message : 'Failed to initialize')
        setLoading(false)
      }
    }

    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selfApp) return

    const socket: Socket = io(`${WS_DB_RELAYER}/websocket`, {
      path: '/',
      query: { sessionId, clientType: 'web' },
      transports: ['websocket'],
    })

    socketRef.current = socket

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

    socket.on('connect_error', () => {
      onError('Failed to connect to Self relayer')
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [selfApp]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpenUrl = () => {
    if (isMiniApp) {
      window.postMessage({ type: 'OPEN_EXTERNAL_URL', payload: { url: qrUrl } }, window.location.origin)
    } else {
      window.open(qrUrl, '_blank')
    }
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
        <QRCode value={qrUrl} size={200} />
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
