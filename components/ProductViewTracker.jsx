'use client'

import { useEffect } from 'react'
import { trackProductView } from '@/lib/personalization'

export default function ProductViewTracker({ produto }) {
  useEffect(() => {
    trackProductView(produto)
  }, [produto])

  return null
}
