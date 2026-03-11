import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'
import {
  getProofData,
  getNumberOfPublicInputs,
  getNullifierFromDisclosureProof,
  getServiceScopeFromDisclosureProof,
  getServiceScopeHash,
} from '@zkpassport/utils'

export const runtime = 'nodejs'

function getVerificationDomain(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host')
  if (forwardedHost) return forwardedHost.split(',')[0].trim().split(':')[0].toLowerCase()
  const host = request.headers.get('host')
  if (host) return host.split(':')[0].toLowerCase()
  return request.nextUrl.hostname
}

type ProofResult = {
  name?: string
  version?: string
  proof?: string
}

function verifyProofs(proofs: ProofResult[], domain: string, uniqueIdentifier: string): { verified: boolean; reason?: string } {
  const discloseProof = proofs.find(p => p.name?.startsWith('disclose'))
  if (!discloseProof?.proof) {
    return { verified: false, reason: 'No disclose proof found' }
  }

  let proofData
  try {
    const numInputs = getNumberOfPublicInputs(discloseProof.name ?? 'disclose_bytes')
    proofData = getProofData(discloseProof.proof, numInputs)
  } catch (err) {
    console.error('[ZKPassport] Failed to extract proof data:', err)
    return { verified: false, reason: 'PROOF_PARSE_FAILED' }
  }

  const expectedScope = getServiceScopeHash(domain)
  const actualScope = getServiceScopeFromDisclosureProof(proofData)
  if (expectedScope !== actualScope) {
    console.error('[ZKPassport] Scope mismatch:', { expected: expectedScope.toString(), actual: actualScope.toString(), domain })
    return { verified: false, reason: 'SCOPE_MISMATCH' }
  }

  const nullifier = getNullifierFromDisclosureProof(proofData).toString()
  if (nullifier !== uniqueIdentifier) {
    console.error('[ZKPassport] Unique identifier mismatch:', { fromProof: nullifier, fromRequest: uniqueIdentifier })
    return { verified: false, reason: 'UNIQUE_IDENTIFIER_MISMATCH' }
  }

  return { verified: true }
}

async function createSignedMessage(domain: string, userId: string, score: number, timestamp: number) {
  const privateKey = process.env.VERIFIER_PRIVATE_KEY
  if (!privateKey) throw new Error('VERIFIER_PRIVATE_KEY is not configured')

  const wallet = new ethers.Wallet(privateKey)
  const message = { domain, userId, score, timestamp }
  const abiCoder = ethers.AbiCoder.defaultAbiCoder()
  const encoded = abiCoder.encode(
    ['string', 'string', 'uint256', 'uint256'],
    [message.domain, String(message.userId), message.score, message.timestamp]
  )
  const messageHash = ethers.keccak256(encoded)
  const signature = await wallet.signMessage(ethers.getBytes(messageHash))
  return { message, signature }
}

export async function POST(request: NextRequest) {
  try {
    const { proofs, queryResult, uniqueIdentifier, devMode: _devMode } = await request.json()

    if (!proofs || !queryResult || !uniqueIdentifier) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const domain = getVerificationDomain(request)
    console.log('[ZKPassport] verifying with domain:', domain)

    const { verified, reason } = verifyProofs(proofs, domain, uniqueIdentifier)
    if (!verified) {
      return NextResponse.json({ error: reason ?? 'PROOF_VERIFICATION_FAILED' }, { status: 401 })
    }

    const timestamp = Math.floor(Date.now() / 1000)
    const score = 100
    const signedResult = await createSignedMessage('zkpassport.id', uniqueIdentifier, score, timestamp)

    return NextResponse.json({
      message: {
        domain: signedResult.message.domain,
        user_id: signedResult.message.userId,
        score: signedResult.message.score,
        timestamp: signedResult.message.timestamp,
      },
      signature: signedResult.signature,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
