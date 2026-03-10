'use client'
import { FC, useState, useEffect, useRef } from 'react'
import { ZKPassport, type ProofResult } from '@zkpassport/sdk'
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

const APP_NAME = process.env.NEXT_PUBLIC_ZKPASSPORT_APP_NAME || 'BringID'
const APP_LOGO = process.env.NEXT_PUBLIC_ZKPASSPORT_APP_LOGO || 'https://widget.bringid.org/logo.png'
const PURPOSE = process.env.NEXT_PUBLIC_ZKPASSPORT_PURPOSE || 'Identity verification'
const DEV_MODE = process.env.NEXT_PUBLIC_ZKPASSPORT_DEV_MODE === 'true'

const isMobileDevice = () =>
  typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

const ZKPassportOverlay: FC<TProps> = ({ task, isMiniApp, onComplete, onError, onClose }) => {
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [url, setUrl] = useState<string | null>(null)

  const zkpassportRef = useRef<ZKPassport | null>(null)
  const requestIdRef = useRef<string | null>(null)
  const proofsRef = useRef<ProofResult[]>([])
  const isMobile = isMobileDevice() || isMiniApp

  useEffect(() => {
    let cancelled = false

    const start = async () => {
      try {
        const zkpassport = new ZKPassport()
        zkpassportRef.current = zkpassport

        const queryBuilder = await zkpassport.request({
          name: APP_NAME,
          logo: APP_LOGO,
          purpose: PURPOSE,
          devMode: DEV_MODE,
        })

        if (cancelled) return

        const {
          url: verificationUrl,
          requestId,
          onBridgeConnect,
          onRequestReceived,
          onGeneratingProof,
          onProofGenerated,
          onResult,
          onReject,
          onError: onSdkError,
        } = queryBuilder.done() as {
          url: string
          requestId: string
          onBridgeConnect: (cb: () => void) => void
          onRequestReceived: (cb: () => void) => void
          onGeneratingProof: (cb: () => void) => void
          onProofGenerated: (cb: (proof: ProofResult) => void) => void
          onResult: (cb: (response: { verified: boolean; uniqueIdentifier: string; result: unknown }) => void | Promise<void>) => void
          onReject: (cb: () => void) => void
          onError: (cb: (error: string) => void) => void
        }

        requestIdRef.current = requestId
        proofsRef.current = []
        setUrl(verificationUrl)
        setLoading(false)

        onBridgeConnect(() => {})
        onRequestReceived(() => {})
        onGeneratingProof(() => {})

        onProofGenerated((proof: ProofResult) => {
          proofsRef.current.push(proof)
        })

        onResult(async (response) => {
          if (!response.verified) {
            onError('Verification failed')
            return
          }

          setProcessing(true)
          try {
            const apiRes = await fetch('/content/api/zkpassport/sign-score', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                proofs: proofsRef.current,
                queryResult: response.result,
                uniqueIdentifier: response.uniqueIdentifier,
                devMode: DEV_MODE,
              }),
            })

            if (!apiRes.ok) {
              const errData = await apiRes.json()
              throw new Error(errData.error || 'Failed to sign score')
            }

            const { message, signature } = await apiRes.json()
            onComplete({ message, signature })
          } catch (err) {
            onError(err instanceof Error ? err.message : 'Unknown error')
          } finally {
            setProcessing(false)
          }
        })

        onReject(() => {
          onError('USER_REJECTED')
        })

        onSdkError((error: string) => {
          onError(error)
        })
      } catch (err) {
        if (!cancelled) {
          onError(err instanceof Error ? err.message : 'Failed to initialize')
          setLoading(false)
        }
      }
    }

    start()

    return () => {
      cancelled = true
      if (requestIdRef.current && zkpassportRef.current) {
        zkpassportRef.current.cancelRequest(requestIdRef.current)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpenUrl = () => {
    if (!url) return
    if (isMiniApp) {
      window.postMessage({ type: 'OPEN_EXTERNAL_URL', payload: { url } }, window.location.origin)
    } else {
      window.open(url, '_blank')
    }
  }

  const renderBody = () => {
    if (loading || processing) return <SpinnerStyled size="large" />
    if (!url) return null

    if (isMobile) {
      return (
        <ButtonStyled appearance="action" onClick={handleOpenUrl}>
          Open ZKPassport
        </ButtonStyled>
      )
    }

    return (
      <QRWrapper>
        <QRCode value={url} size={200} />
        <QRHint>Scan with ZKPassport app</QRHint>
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

export default ZKPassportOverlay
