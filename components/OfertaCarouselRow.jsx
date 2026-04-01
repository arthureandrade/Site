'use client'

import { useEffect, useMemo, useState } from 'react'
import OfertaCard from '@/components/OfertaCard'

function getVisibleCount() {
  if (typeof window === 'undefined') return 5
  if (window.innerWidth >= 1280) return 5
  if (window.innerWidth >= 1024) return 4
  if (window.innerWidth >= 640) return 3
  return 2
}

function getDuration(produtosLength) {
  const base = Math.max(produtosLength, 5)
  return Math.max(base * 4.5, 22)
}

export default function OfertaCarouselRow({
  produtos = [],
  desconto = 0,
  badge = 'Online',
  cardVariant = 'default',
  itemKeyPrefix = 'oferta',
}) {
  const [visibleCount, setVisibleCount] = useState(getVisibleCount)

  useEffect(() => {
    function handleResize() {
      setVisibleCount(getVisibleCount())
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const trackItems = useMemo(() => {
    if (!produtos.length) return []
    return [...produtos, ...produtos]
  }, [produtos])

  if (!produtos.length) return null

  const itemWidth = `calc((100% - ${(visibleCount - 1) * 16}px) / ${visibleCount})`
  const duration = `${getDuration(produtos.length)}s`

  return (
    <div className="marquee-wrapper">
      <div
        className="marquee-track gap-3 sm:gap-4"
        style={{
          animationDuration: duration,
        }}
      >
        {trackItems.map((produto, indice) => (
          <div
            key={`${itemKeyPrefix}-${produto.id}-${indice}`}
            className="shrink-0"
            style={{ width: itemWidth }}
          >
            <OfertaCard
              produto={produto}
              desconto={desconto}
              badge={badge}
              destaque={indice % produtos.length === 0}
              variant={cardVariant}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
