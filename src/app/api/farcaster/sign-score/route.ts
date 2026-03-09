import { NextRequest, NextResponse } from 'next/server'
import { createAppClient, viemConnector } from '@farcaster/auth-client'
import { NeynarAPIClient, Configuration } from '@neynar/nodejs-sdk'
import { ethers } from 'ethers'

const FARCASTER_DOMAIN = process.env.NEXT_PUBLIC_FARCASTER_DOMAIN || 'widget.bringid.org'
const EARLY_ADOPTER_FID_THRESHOLD = 20000
const SCORE_TIERS = [
  { min: 0.9, score: 70 },
  { min: 0.7, score: 30 },
  { min: 0.5, score: 10 },
] as const

async function verifyFarcasterAuth(message: string, signature: `0x${string}`, nonce: string) {
  const client = createAppClient({ ethereum: viemConnector() })
  const result = await client.verifySignInMessage({
    message,
    signature,
    domain: FARCASTER_DOMAIN,
    nonce,
  })
  if (result.success && result.fid) return { success: true, fid: result.fid }
  const r = result as { success: false; error?: { message?: string } }
  return { success: false, error: r.error?.message || 'Verification failed' }
}

async function getScore(fid: number): Promise<number> {
  if (fid < EARLY_ADOPTER_FID_THRESHOLD) return 70

  const apiKey = process.env.NEYNAR_API_KEY
  if (!apiKey) throw new Error('NEYNAR_API_KEY is not configured')

  const client = new NeynarAPIClient(new Configuration({ apiKey }))
  const response = await client.fetchBulkUsers({ fids: [fid] })
  const user = response.users[0]
  if (!user) throw new Error('USER_NOT_FOUND')


  return 10
  // const neynarScore = user.score ?? 0
  // if (neynarScore < 0.5) throw new Error('NOT_ENOUGH_SCORE')

  // for (const tier of SCORE_TIERS) {
  //   if (neynarScore >= tier.min) return tier.score
  // }
  // return 0
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
    const { message, signature, nonce } = await request.json()

    if (!message || !signature || !nonce) {
      return NextResponse.json(
        { error: 'Invalid request: message, signature, and nonce are required' },
        { status: 400 }
      )
    }

    const verifyResult = await verifyFarcasterAuth(message, signature as `0x${string}`, nonce)
    if (!verifyResult.success || !verifyResult.fid) {
      return NextResponse.json({ error: verifyResult.error || 'Authentication failed' }, { status: 401 })
    }

    const score = await getScore(verifyResult.fid)
    const timestamp = Math.floor(Date.now() / 1000)
    const signedResult = await createSignedMessage('farcaster.xyz', String(verifyResult.fid), score, timestamp)

    // Return user_id (snake_case) to match the popup message format that verifyOAuth expects
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
    if (error instanceof Error) {
      if (error.message.startsWith('NOT_ENOUGH_SCORE')) {
        return NextResponse.json({ error: 'NOT_ENOUGH_SCORE' }, { status: 400 })
      }
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
