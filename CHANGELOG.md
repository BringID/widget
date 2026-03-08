# Changelog

## 0.1.0 — 2026-03-08

### Added

- `redirectUrl` support in `PROOFS_REQUEST` payload — URL-encoded deep link passed from the SDK constructor to the widget for OAuth redirect flows
- `isMiniApp` flag in `PROOFS_REQUEST` payload — auto-detected by the SDK; signals the widget to use `OPEN_EXTERNAL_URL` postMessage instead of `window.open`
- `OPEN_EXTERNAL_URL` outbound postMessage — sent to the parent when the widget needs to open an external URL inside a mini-app context (e.g. Farcaster frame)
- `MANUAL_OPEN_LINK` message overlay — shown when `redirectUrl` targets Base app (`https://base.app/...`) or Coinbase Wallet (`cbwallet://...`); allows the user to copy the link to clipboard instead of attempting direct navigation
- `CopyText` component (`message-overlay/components/copy-text`) — clickable copy-to-clipboard UI used in the `MANUAL_OPEN_LINK` overlay

### Changed

- `isFarcaster` field renamed to `isMiniApp` throughout the store, types, and task components
- `FARCASTER_OPEN_URL` postMessage type renamed to `OPEN_EXTERNAL_URL`
- `encode_params` query param added to OAuth redirect URL when targeting Base app or Coinbase Wallet deep links
- `onMessage` callback in `Task` and `VerificationsList` components now accepts an optional `copyText` argument for the overlay
- Initial modal loading state set to `true` so the loading overlay is shown immediately on mount
- Debug log panel hidden by default (`display: none`)
- `setConfigsPhase('idle')` removed from the logout flow to avoid resetting config state prematurely

### Fixed

- Double URL-encoding of `verificationMessage` in `PROOFS_REQUEST` — the widget now checks for residual `%` characters and decodes a second time if needed
