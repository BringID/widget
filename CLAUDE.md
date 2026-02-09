# BringID Widget - Complete Documentation

## Project Overview

**BringID Widget** is a Next.js-based embeddable widget for identity verification and zero-knowledge proof generation using the Semaphore Protocol. It is loaded as an iframe by parent websites and communicates via postMessage to handle proof requests, OAuth verification, and BringID browser extension (ZK-TLS) verification flows.

### Purpose

The widget enables websites to request and receive zero-knowledge identity proofs from users. It supports two verification methods:
- **OAuth**: Opens a popup to `https://auth.bringid.org` for GitHub/Twitter verification
- **ZK-TLS**: Communicates with the BringID browser extension for TLS notarization-based verification

After verification, the widget generates Semaphore ZK proofs and returns them to the parent website.

### Technology Stack

- **Framework**: Next.js 15.0.7 with Turbopack
- **Language**: TypeScript
- **UI**: React 19 (RC) with Styled Components
- **State Management**: Redux
- **ZK Proofs**: @semaphore-protocol/core, identity, data
- **Blockchain**: Ethers.js v6 (ABI encoding, keccak256)
- **Analytics**: Plausible (widget.bringid.org)
- **License**: AGPL3

### Architecture

```
┌─────────────────────────────────────────────┐
│        Parent Website (iframe host)         │
│    Sends PROOFS_REQUEST / USER_KEY_READY    │
│    Receives PROOFS_RESPONSE / CLOSE_MODAL   │
└──────────────────┬──────────────────────────┘
                   │ postMessage
┌──────────────────▼──────────────────────────┐
│            BringID Widget (iframe)          │
│  ┌────────────┐  ┌────────────────────────┐ │
│  │   Redux    │  │   Verification Flow    │ │
│  │   Store    │  │  ┌──────┐  ┌────────┐  │ │
│  │           │  │  │OAuth │  │ ZK-TLS │  │ │
│  └────────────┘  │  │Popup │  │  Ext.  │  │ │
│                  │  └──┬───┘  └───┬────┘  │ │
│                  └─────┼──────────┼───────┘ │
└────────────────────────┼──────────┼─────────┘
                         │          │
           ┌─────────────▼┐    ┌────▼──────────┐
           │ auth.bringid │    │  BringID      │
           │   .org       │    │  Extension    │
           └──────────────┘    └───────────────┘
                         │          │
               ┌─────────▼──────────▼─────────┐
               │      api.bringid.org         │
               │  ┌─────────┐ ┌────────────┐  │
               │  │Verifier │ │Task Manager│  │
               │  └─────────┘ └────────────┘  │
               │  ┌─────────┐                 │
               │  │Indexer  │                 │
               │  └─────────┘                 │
               └──────────────────────────────┘
```

### Key Components

1. **Inner Content** (`src/app/content/inner-content/index.tsx`): Core component with postMessage handlers
2. **Pages**: Home (verification list) and Proofs (proof generation)
3. **API Services**:
   - `api/indexer/`: Fetches merkle proofs from the indexer
   - `api/task-manager/`: Creates and tracks verification tasks
   - `api/verifier/`: Submits OAuth and ZK-TLS proofs for verification
4. **Semaphore** (`src/app/content/semaphore/`): Wrapper around Semaphore protocol
5. **Relayer** (`src/app/content/relayer/`): Relayer for blockchain transactions
6. **Store** (`src/app/content/store/`): Redux store with user, modal, verifications, configs reducers
7. **Utils**:
   - `get-auth-semaphore-data.tsx`: OAuth popup flow
   - `get-zk-tls-semaphore-data.tsx`: Extension communication flow
   - `create-semaphore-identity.tsx`: Semaphore identity derivation
   - `prepare-proofs.tsx`: ZK proof generation from verifications

### Directory Structure

```
/src/
├── /app/
│   ├── /content/
│   │   ├── /inner-content/     # Core postMessage handler component
│   │   ├── /pages/             # Home and Proofs pages
│   │   ├── /components/        # UI components (authorize, header, verifications list)
│   │   ├── /api/
│   │   │   ├── indexer/        # Proof indexing API
│   │   │   ├── task-manager/   # Task management API
│   │   │   └── verifier/       # Verification API
│   │   ├── /semaphore/         # Semaphore protocol wrapper
│   │   ├── /relayer/           # Blockchain relayer
│   │   ├── /store/             # Redux store and reducers
│   │   └── /utils/             # Proof preparation utilities
│   ├── /configs/               # App configs and chain definitions
│   └── /core/                  # Remote config loading from GitHub
├── /components/common/         # Reusable UI components (Button, Text, Icons)
├── /types/                     # TypeScript type definitions
├── /utils/                     # Utility functions
├── /themes/                    # Light/dark theme configs
├── /hooks/                     # Custom React hooks
└── /images/                    # Static images
```

---

## Build & Development

**Package Manager:** Yarn

### Commands

```bash
yarn dev          # Development server (Next.js + Turbopack)
yarn build        # Production build
yarn start        # Production server
yarn lint         # ESLint
yarn clean        # Clean .next build cache
```

### Environment Variables

**Required:**
- `NEXT_PUBLIC_ZUPLO_API_KEY`: Bearer token for API authentication
- `NEXT_PUBLIC_TASK_PENDING_TIME`: Pending time for verification tasks

### Widget URL Parameters

The widget is loaded in an iframe with these query parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `url` | string | Parent website origin (URL-encoded) |
| `address` | string | User's wallet address |
| `apiKey` | string | API key from parent |
| `theme` | string | `light` or `dark` |
| `mode` | string | `dev` or `production` |
| `highlightColor` | string | Custom highlight color (URL-encoded hex) |

**Example:**
```
https://widget.bringid.org?url=https%3A%2F%2Fexample.com&address=0x...&apiKey=...&theme=dark&mode=production
```

---

## PostMessage Communication

The widget uses postMessage extensively for cross-origin communication between:
- **Parent website** (iframe host)
- **OAuth popup windows** (auth.bringid.org)
- **BringID browser extension** (ZK-TLS)

### Message Type Definition

```typescript
type TWidgetMessage = {
  type: string
  requestId?: string
  payload?: Record<string, any>
}
```

---

### Messages Sent FROM the Widget

#### 1. PROOFS_RESPONSE

Sent when the user confirms proof selection and proofs are generated.

**Source:** `src/app/content/inner-content/index.tsx`

```typescript
window.postMessage({
  type: 'PROOFS_RESPONSE',
  requestId: string,
  payload: {
    proofs: TSemaphoreProof[],
    points: number
  }
}, window.location.origin)
```

**Payload:**

```typescript
interface TSemaphoreProof {
  credential_group_id: string
  semaphore_proof: {
    merkle_tree_depth: number
    merkle_tree_root: string
    nullifier: string
    message: string
    scope: string
    points: number
  }
}
```

#### 2. CLOSE_MODAL

Sent when the user closes the widget.

**Source:** `src/app/content/inner-content/index.tsx`, `src/app/content/components/header/index.tsx`

```typescript
window.postMessage({
  type: 'CLOSE_MODAL',
  requestId: string
}, window.location.origin)
```

#### 3. GENERATE_USER_KEY

Sent to parent to request user key generation (wallet signature).

**Source:** `src/app/content/components/authorize/index.tsx`

```typescript
window.postMessage({
  type: 'GENERATE_USER_KEY',
  payload: {
    message: "Sign to derive your BringID key.\nRecoverable by re-signing with the same wallet."
  }
}, parentOrigin)
```

---

### Messages Received BY the Widget

**Handler:** `src/app/content/inner-content/index.tsx`

The widget sets up a message listener that validates origin and source before processing.

#### 1. PROOFS_REQUEST

Sent by the parent website to request proofs with specific requirements.

**Origin:** Parent website (`event.source === window.parent`)

```typescript
{
  type: 'PROOFS_REQUEST',
  requestId: string,
  payload: {
    scope?: string,       // Custom scope for proofs
    message?: string,     // Custom message for proofs
    minPoints?: number    // Minimum points required
  }
}
```

#### 2. USER_KEY_READY

Sent by the parent website after the user signs the key generation message.

**Origin:** Parent website (`event.source === window.parent`)

```typescript
{
  type: 'USER_KEY_READY',
  payload: {
    signature: string     // User's wallet signature (master key)
  }
}
```

---

### OAuth Popup Communication

**File:** `src/utils/get-auth-semaphore-data.tsx`

The widget opens a popup to `https://auth.bringid.org/{verificationUrl}` for OAuth verification and listens for responses.

#### AUTH_SUCCESS (received from popup)

```typescript
interface TOAuthSuccessResponse {
  type: "AUTH_SUCCESS"
  payload: {
    message: {
      domain: string      // OAuth provider domain (e.g., "github.com", "x.com")
      userId: string      // User ID from OAuth provider
      score: number       // Trust score (10, 30, or 70)
      timestamp: number   // Unix timestamp
    }
    signature: string     // Ethereum signature (hex with 0x prefix)
  }
}
```

#### AUTH_ERROR (received from popup)

```typescript
interface TOAuthErrorResponse {
  type: "AUTH_ERROR"
  payload: {
    error: string         // Error code
  }
}
```

**Flow:**
1. Widget opens popup to `auth.bringid.org/{verificationUrl}`
2. User authenticates with OAuth provider (GitHub/Twitter)
3. OAuth API validates, calculates score, signs message
4. Popup sends `AUTH_SUCCESS` or `AUTH_ERROR` via postMessage
5. Widget processes the response and closes popup

---

### BringID Extension Communication (ZK-TLS)

**File:** `src/utils/get-zk-tls-semaphore-data.tsx`

Communication with the BringID browser extension for TLS notarization-based verification.

**Extension URL:** https://chromewebstore.google.com/detail/bringid/fjlmbkpfjmbjokokgmfcijlliceljbeh

#### REQUEST_ZKTLS_VERIFICATION (sent to extension)

```typescript
window.postMessage({
  type: 'REQUEST_ZKTLS_VERIFICATION',
  payload: {
    task: string,           // JSON.stringify(task)
    origin: string          // window.location.origin
  },
  requestId: string
}, '*')
```

#### VERIFICATION_DATA_READY (received from extension)

```typescript
interface TZKTLSSuccessResponse {
  type: 'VERIFICATION_DATA_READY'
  requestId: string
  payload: {
    transcriptRecv: string      // TLS transcript data
    presentationData: string    // Presentation proof data
  }
}
```

#### VERIFICATION_DATA_ERROR (received from extension)

```typescript
interface TZKTLSErrorResponse {
  type: 'VERIFICATION_DATA_ERROR'
  requestId: string
  payload: {
    error: string
  }
}
```

**Flow:**
1. Widget sends `REQUEST_ZKTLS_VERIFICATION` via window.postMessage
2. BringID extension picks up the message and performs TLS notarization
3. Extension responds with `VERIFICATION_DATA_READY` or `VERIFICATION_DATA_ERROR`
4. Widget processes the response (30-minute timeout)

**Validation:** `src/utils/is-valid-zktls-success-message.tsx`, `src/utils/is-valid-zktls-error-message.tsx`

---

## API Endpoints

All API calls use Bearer token authentication via `ZUPLO_API_KEY`.

**Base URL:** `https://api.bringid.org`

### 1. GET /v1/indexer/{networkName}/proofs

Fetches a single proof by identity commitment and semaphore group ID.

**File:** `src/app/content/api/indexer/index.tsx`

#### Request

**Headers:**
```
Authorization: Bearer {ZUPLO_API_KEY}
Content-Type: application/json
```

**Query Parameters:**
- `identity_commitment` (string): Semaphore identity commitment
- `semaphore_group_id` (string): Semaphore group ID
- `fetch_proofs` (boolean): Whether to include full proof data

---

### 2. POST /v1/indexer/{networkName}/proofs

Fetches multiple proofs in a batch request.

**File:** `src/app/content/api/indexer/index.tsx`

#### Request

**Headers:**
```
Authorization: Bearer {ZUPLO_API_KEY}
Content-Type: application/json
```

**Body:**
```typescript
{
  data: Array<{
    identity_commitment: string,
    semaphore_group_id: string
  }>,
  fetch_proofs: boolean
}
```

---

### 3. POST /v1/verifier/verify?environment={mode}

Submits a ZK-TLS proof for verification.

**File:** `src/app/content/api/verifier/index.tsx`

#### Request

**Headers:**
```
Authorization: Bearer {ZUPLO_API_KEY}
Content-Type: application/json
```

**Body:**
```typescript
{
  tlsn_presentation: string,
  registry: string,
  credential_group_id: string,
  semaphore_identity_commitment: string
}
```

---

### 4. POST /v1/verifier/verify/oauth?environment={mode}

Submits an OAuth proof for verification.

**File:** `src/app/content/api/verifier/index.tsx`

#### Request

**Headers:**
```
Authorization: Bearer {ZUPLO_API_KEY}
Content-Type: application/json
```

**Body:**
```typescript
{
  message: {
    domain: string,          // e.g., "github.com" or "x.com"
    userId: string,          // User ID from provider
    score: number,           // 10, 30, or 70
    timestamp: number        // Unix timestamp
  },
  signature: string,         // Ethereum signature from OAuth API
  registry: string,
  credential_group_id: string,
  semaphore_identity_commitment: string
}
```

---

### 5. POST /v1/task-manager/{networkName}/verification/tasks

Creates a verification task for blockchain inclusion.

**File:** `src/app/content/api/task-manager/index.tsx`

#### Request

**Headers:**
```
Authorization: Bearer {ZUPLO_API_KEY}
Content-Type: application/json
```

**Body:**
```typescript
{
  registry: string,
  credential_group_id: string,
  id_hash: string,
  identity_commitment: string,
  verifier_signature: string
}
```

#### Response

```typescript
{
  success: boolean,
  task: {
    id: string,
    status: string,
    scheduled_time: number,
    batch_id: string,
    credential_group_id: string
  }
}
```

---

### 6. GET /v1/task-manager/{networkName}/verification/tasks/{taskId}

Fetches the status of a verification task.

**File:** `src/app/content/api/task-manager/index.tsx`

#### Request

**Headers:**
```
Authorization: Bearer {ZUPLO_API_KEY}
Content-Type: application/json
```

---

## Authentication & Identity

### User Key Generation Flow

1. User clicks "Create BringID key" in the widget
2. Widget sends `GENERATE_USER_KEY` postMessage to parent
3. Parent website prompts the user to sign a message with their wallet
4. Parent returns `USER_KEY_READY` with the signature
5. Widget stores the signature as the master key in Redux

### Semaphore Identity Derivation

**File:** `src/utils/create-semaphore-identity.tsx`

```typescript
const createSemaphoreIdentity = (masterKey: string, credentialGroupId: string) => {
  const coder = new AbiCoder()
  const encoded = coder.encode(['string', 'string'], [masterKey, credentialGroupId])
  const identityKey = keccak256(encoded)
  const identity = new Identity(identityKey)
  return identity
}
```

**Process:**
1. ABI-encode the master key (user signature) + credentialGroupId
2. Hash with keccak256 to derive a unique identity key
3. Create Semaphore Identity from the hash

### Verification Flow

**Two verification paths:**

| Step | OAuth | ZK-TLS |
|------|-------|--------|
| 1 | Opens popup to auth.bringid.org | Sends request to BringID extension |
| 2 | User authenticates with provider | Extension performs TLS notarization |
| 3 | Receives AUTH_SUCCESS with signed message | Receives VERIFICATION_DATA_READY |
| 4 | Submits to `/v1/verifier/verify/oauth` | Submits to `/v1/verifier/verify` |
| 5 | Creates task via `/v1/task-manager` | Creates task via `/v1/task-manager` |
| 6 | Waits for task completion | Waits for task completion |
| 7 | Fetches merkle proof from indexer | Fetches merkle proof from indexer |
| 8 | Generates Semaphore ZK proof | Generates Semaphore ZK proof |

---

## Configuration

### Remote Configuration Loading

**File:** `src/app/core/index.tsx`

Configs and tasks are loaded from GitHub at runtime:

```
# Development
https://raw.githubusercontent.com/BringID/configs/main/dev-configs.json
https://raw.githubusercontent.com/BringID/configs/main/tasks-sepolia.json

# Production
https://raw.githubusercontent.com/BringID/configs/main/configs.json
https://raw.githubusercontent.com/BringID/configs/main/tasks.json
```

**Returns:**
```typescript
{
  tasks: TTask[],
  configs: {
    REGISTRY: string,    // Semaphore registry contract address
    CHAIN_ID: string     // Blockchain chain ID
  }
}
```

### App Constants

**File:** `src/app/configs/index.tsx`

| Constant | Value |
|----------|-------|
| `EXTENSION_URL` | https://chromewebstore.google.com/detail/bringid/fjlmbkpfjmbjokokgmfcijlliceljbeh |
| `ZUPLO_API_URL` | https://api.bringid.org |
| `AUTH_DOMAIN` | https://auth.bringid.org |
| `BRINGID_URL` | https://bringid.org |
| `PLAUSIBLE_DOMAIN` | widget.bringid.org |
| `TELEGRAM_URL` | https://t.me/bringid_chat |

### Blockchain Support

**File:** `src/app/configs/chains.tsx`

| Chain ID | Name | Type | RPC | Explorer |
|----------|------|------|-----|----------|
| 8453 | Base | Mainnet | https://developer-access-mainnet.base.org | https://basescan.org |
| 84532 | Base Sepolia | Testnet | https://base-sepolia.drpc.org | https://sepolia.basescan.org |

---

## Data Models

### TTask

```typescript
{
  id: string
  type: 'oauth' | 'zktls'
  groups: Array<{
    credentialGroupId: string
    semaphoreGroupId: string
    points: number
    name: string
  }>
}
```

### TVerification

```typescript
{
  status: 'pending' | 'completed' | 'failed'
  scheduledTime: number
  credentialGroupId: string
  batchId?: string | null
  txHash?: string
  fetched: boolean
  taskId: string
}
```

### TSemaphoreProof

```typescript
{
  credential_group_id: string
  semaphore_proof: {
    merkle_tree_depth: number
    merkle_tree_root: string
    nullifier: string
    message: string
    scope: string
    points: number
  }
}
```

### TOAuthMessage

```typescript
{
  domain: string      // OAuth provider domain
  userId: string      // User ID from OAuth provider
  score: number       // Trust score (10, 30, or 70)
  timestamp: number   // Unix timestamp
}
```

---

## Services & External Dependencies

### BringID Services

| Service | URL | Purpose |
|---------|-----|---------|
| **BringID API** | https://api.bringid.org | Indexer, Verifier, Task Manager APIs (via Zuplo gateway) |
| **OAuth API** | https://auth.bringid.org | GitHub/Twitter OAuth verification and score signing |
| **Configs** | GitHub (BringID/configs) | Remote configuration and task definitions |
| **Extension** | Chrome Web Store | BringID ZK-TLS browser extension |

### Third-Party Services

| Service | Purpose |
|---------|---------|
| **Plausible Analytics** | Privacy-friendly usage analytics (widget.bringid.org) |
| **Base / Base Sepolia** | Blockchain networks for Semaphore proof verification |
| **Semaphore Protocol** | Zero-knowledge group membership proofs |

---

## Analytics Events

**Service:** Plausible (`widget.bringid.org`)

| Event | Description |
|-------|-------------|
| `generate_user_key_started` | User initiated key generation |
| `generate_user_key_finished` | Key generation completed |
| `verify_humanity_request_started` | Verification flow started |
| `verify_humanity_request_finished` | Verification flow completed |
| `prepare_proofs_started` | ZK proof generation started |
| `prepare_proofs_finished` | ZK proof generation completed |
| `prepare_proofs_failed` | ZK proof generation failed |
| `oauth_verification_response_received` | OAuth response received successfully |
| `oauth_verification_failed` | OAuth verification failed |
| `zktls_verification_response_received` | ZK-TLS response received successfully |
| `zktls_verification_failed` | ZK-TLS verification failed |
| `close_modal` | User closed the widget |
| `back_to_home` | User navigated back to home |

---

## Security

1. **Origin Validation**: All postMessage handlers validate `event.origin` and `event.source`
2. **Request ID Tracking**: Responses must match corresponding request IDs
3. **API Authentication**: All API calls use Bearer token (`ZUPLO_API_KEY`)
4. **Cryptographic Identity**: Semaphore identity derived from keccak256 hash of wallet signature
5. **ZK Proofs**: Generated via @semaphore-protocol/core for privacy-preserving verification
6. **Popup Validation**: OAuth popup origin and source verified before accepting messages
7. **Extension Isolation**: ZK-TLS requests validated by requestId matching

---

## Important Notes

1. **Iframe Embedding**: The widget is designed to be embedded as an iframe. It communicates with the parent website exclusively via postMessage.

2. **Wallet Requirement**: The parent website must handle wallet signing. The widget sends `GENERATE_USER_KEY` and expects `USER_KEY_READY` in return.

3. **Two Verification Paths**: OAuth (popup-based) and ZK-TLS (extension-based) verification paths are independent. Task type determines which path is used.

4. **Remote Configuration**: Tasks and configs are loaded from GitHub at runtime, allowing updates without redeployment.

5. **Proof Generation**: After verification, proofs are generated client-side using the Semaphore protocol. Merkle proofs are fetched from the indexer.

6. **Timeout**: ZK-TLS extension communication has a 30-minute timeout.

7. **Mode Support**: `dev` mode uses Base Sepolia testnet; `production` mode uses Base mainnet.

8. **Theme Support**: The widget supports `light` and `dark` themes, plus custom highlight colors passed via URL parameters.
