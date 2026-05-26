'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { trackPageView } from '@/lib/analytics'

export default function AnalyticsRouteTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const query = searchParams?.toString()
    trackPageView({ path: `${pathname || '/'}${query ? `?${query}` : ''}` })
  }, [pathname, searchParams])

  return null
}
