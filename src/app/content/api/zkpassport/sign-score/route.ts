import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'
import { ZKPassport, type ProofResult, type QueryResult } from '@zkpassport/sdk'

export const runtime = 'nodejs'
export const maxDuration = 300

const DEV_MODE = process.env.NEXT_PUBLIC_ZKPASSPORT_DEV_MODE === 'true'

function getVerificationDomain(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host')
  if (forwardedHost) return forwardedHost.split(',')[0].trim().split(':')[0].toLowerCase()
  const host = request.headers.get('host')
  if (host) return host.split(':')[0].toLowerCase()
  return request.nextUrl.hostname
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
    const { proofs, queryResult, uniqueIdentifier, devMode } = await request.json() as {
      proofs: ProofResult[]
      queryResult: QueryResult
      uniqueIdentifier: string
      devMode?: boolean
    }

    if (!proofs || !queryResult || !uniqueIdentifier) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const domain = getVerificationDomain(request)
    console.log('[ZKPassport] verifying with domain:', domain)

    const zkpassport = new ZKPassport(domain)
    const result = await zkpassport.verify({
      proofs,
      queryResult,
      devMode: devMode ?? DEV_MODE,
      writingDirectory: '/tmp',
    })

    console.log('[ZKPassport] verification result:', {
      verified: result.verified,
      uniqueIdentifier: result.uniqueIdentifier,
      queryResultErrors: result.queryResultErrors,
    })

    if (!result.verified) {
      return NextResponse.json({ error: 'PROOF_VERIFICATION_FAILED' }, { status: 401 })
    }

    if (result.uniqueIdentifier !== uniqueIdentifier) {
      console.error('[ZKPassport] Unique identifier mismatch:', {
        fromProof: result.uniqueIdentifier,
        fromRequest: uniqueIdentifier,
      })
      return NextResponse.json({ error: 'UNIQUE_IDENTIFIER_MISMATCH' }, { status: 400 })
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
    console.error('[ZKPassport] Error in sign-score:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
