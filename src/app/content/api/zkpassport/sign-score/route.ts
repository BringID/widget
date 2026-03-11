import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'

export const runtime = 'nodejs'

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
    const { proofs, queryResult, uniqueIdentifier, devMode } = await request.json()

    if (!proofs || !queryResult || !uniqueIdentifier) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const domain = getVerificationDomain(request)
    console.log('[ZKPassport] verifying with domain:', domain)

    const { ZKPassport } = await import('@zkpassport/sdk')
    const zkPassport = new ZKPassport(domain)
    const result = await zkPassport.verify({
      proofs,
      queryResult,
      devMode: devMode ?? DEV_MODE,
    })

    if (!result.verified) {
      console.error('ZKPassport verification failed:', JSON.stringify(result.queryResultErrors ?? result, null, 2))
      return NextResponse.json({ error: 'PROOF_VERIFICATION_FAILED', details: result.queryResultErrors }, { status: 401 })
    }

    if (result.uniqueIdentifier !== uniqueIdentifier) {
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
