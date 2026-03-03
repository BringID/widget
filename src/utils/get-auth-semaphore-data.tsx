import {
  TOAuthResponse,
  TOAuthResponsePayload,
  TVerificationType
} from '../types'
import {
  isValidAuthErrorPayload,
  isValidAuthSuccessPayload
} from '.'
import { TTask } from '../types'
import configs from '@/app/configs'

type TGetAuthSemaphoreData = (
  task: TTask,
  plausibleEvent: (eventName: string, options?: {
    props?: Record<string, string>
  }) => void
) => Promise<
  TOAuthResponsePayload
>

const isInRestrictedWebView = (): boolean => {
  const ua = navigator.userAgent.toLowerCase()
  // Farcaster / Warpcast mini app
  if (ua.includes('warpcast')) return true
  // Coinbase Wallet / Base dapp browser
  if (ua.includes('coinbasebrowser') || ua.includes('coinbase')) return true
  return false
}

const IFRAME_LOAD_TIMEOUT_MS = 8000

const createIframeOverlay = (
  popupURL: string,
  onCancel: () => void
): { overlayEl: HTMLDivElement; iframeEl: HTMLIFrameElement } => {
  const overlayEl = document.createElement('div')
  overlayEl.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;background:#fff'

  const header = document.createElement('div')
  header.style.cssText = 'display:flex;align-items:center;justify-content:flex-end;padding:8px 12px;border-bottom:1px solid #e5e7eb;flex-shrink:0'

  const cancelBtn = document.createElement('button')
  cancelBtn.textContent = '✕'
  cancelBtn.style.cssText = 'background:transparent;border:1px solid #d1d5db;border-radius:6px;width:32px;height:32px;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;color:#374151'
  cancelBtn.onclick = onCancel

  header.appendChild(cancelBtn)

  const contentArea = document.createElement('div')
  contentArea.style.cssText = 'position:relative;flex:1;display:flex'

  const statusEl = document.createElement('div')
  statusEl.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:sans-serif;font-size:14px;color:#6b7280;padding:16px;text-align:center'
  statusEl.textContent = 'Loading...'

  const iframeEl = document.createElement('iframe')
  iframeEl.src = popupURL
  iframeEl.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:none'
  iframeEl.allow = 'popups'

  const loadTimeout = setTimeout(() => {
    statusEl.style.color = '#ef4444'
    statusEl.textContent = 'Failed to load the authorization page. Please close and try again.'
    iframeEl.style.display = 'none'
  }, IFRAME_LOAD_TIMEOUT_MS)

  iframeEl.onload = () => {
    clearTimeout(loadTimeout)
    statusEl.style.display = 'none'
  }

  contentArea.appendChild(statusEl)
  contentArea.appendChild(iframeEl)
  overlayEl.appendChild(header)
  overlayEl.appendChild(contentArea)
  document.body.appendChild(overlayEl)

  return { overlayEl, iframeEl }
}

const getAuthSemaphoreData: TGetAuthSemaphoreData = (
  task,
  plausibleEvent
) => {

  const popupURL = task.verificationType === 'oauth' ? `${configs.AUTH_DOMAIN}/${task.verificationUrl}` : task.verificationUrl
  const awaitingEventSource = task.verificationType === 'oauth' ? configs.AUTH_DOMAIN : new URL(task.verificationUrl).origin

  return new Promise((resolve, reject) => {
    let popup: Window | null = null
    let overlayEl: HTMLDivElement | null = null
    let iframeEl: HTMLIFrameElement | null = null

    if (isInRestrictedWebView()) {
      // React Native WebViews (Farcaster/Warpcast, Base dapp browser, etc.)
      // intercept window.open() and either block it or navigate the current frame.
      // Skip window.open() entirely and use an inline iframe overlay instead.
      plausibleEvent('oauth_popup_blocked')

      const overlay = createIframeOverlay(popupURL, () => {
        cleanup()
        plausibleEvent('oauth_popup_closed')
        reject('POPUP_CLOSED')
      })
      overlayEl = overlay.overlayEl
      iframeEl = overlay.iframeEl
    } else {
      popup = window.open(popupURL, 'oauth', 'width=400,height=600,popup=yes')

      if (!popup) {
        plausibleEvent('oauth_popup_blocked')
        reject('POPUP_BLOCKED')
        return
      }
    }

    const cleanup = () => {
      if (timer) clearInterval(timer)
      window.removeEventListener('message', handler)
      if (overlayEl) {
        overlayEl.remove()
        overlayEl = null
      }
    }

    let timer: ReturnType<typeof setInterval> | null = null

    if (popup) {
      timer = setInterval(() => {
        if (!popup || popup.closed) {
          cleanup()
          plausibleEvent('oauth_popup_closed')
          reject('POPUP_CLOSED')
        }
      }, 500)
    }

    const handler = async (event: MessageEvent) => {

      if (event.origin !== awaitingEventSource) return

      const isFromPopup = popup && event.source === popup
      const isFromIframe = iframeEl && event.source === iframeEl.contentWindow
      if (!isFromPopup && !isFromIframe) return

      if (!event.data || typeof event.data !== 'object' || !event.data.type) {
        console.warn('Invalid message structure received')
        return
      }

      const data = event.data as TOAuthResponse

      switch (data.type) {
        case "AUTH_SUCCESS": {
          if (!isValidAuthSuccessPayload(data.payload)) {
            cleanup()
            reject('INVALID_PAYLOAD_STRUCTURE')
            break
          }

          const { message, signature } = data.payload

          plausibleEvent('oauth_verification_response_received')
          cleanup()
          resolve({ message, signature })
          break
        }

        case "AUTH_ERROR": {
          if (!isValidAuthErrorPayload(data.payload)) {
            cleanup()
            reject('INVALID_ERROR_PAYLOAD')
            break
          }

          cleanup()
          plausibleEvent('oauth_verification_failed', {
            props: {
              task_id: task.id
            }
          })

          reject(event.data.payload.error)
          break
        }
      }
    }

    window.addEventListener('message', handler)
  })

};

export default getAuthSemaphoreData
