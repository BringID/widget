import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'

export const runtime = 'nodejs'

const DOMAIN = process.env.ZKPASSPORT_DOMAIN || 'widget.bringid.org'
const DEV_MODE = process.env.NEXT_PUBLIC_ZKPASSPORT_DEV_MODE === 'true'

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

    // Server-side proof verification via CJS require to avoid Next.js ESM bundling issues
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { ZKPassport } = require('@zkpassport/sdk')
    const zkPassport = new ZKPassport(DOMAIN)
    const result = await zkPassport.verify({
      proofs,
      queryResult,
      devMode: devMode ?? DEV_MODE,
    })

    if (!result.verified) {
      return NextResponse.json({ error: 'PROOF_VERIFICATION_FAILED' }, { status: 401 })
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
