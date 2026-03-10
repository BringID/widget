'use client'
import { useEffect } from 'react'

export default function FarcasterDone() {
  useEffect(() => {
    window.close()
  }, [])

  return null
}
