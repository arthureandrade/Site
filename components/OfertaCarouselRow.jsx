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
            className="w-[calc(50%_-_6px)] shrink-0 sm:w-[calc(33.333%_-_11px)] lg:w-[calc(25%_-_12px)] xl:w-[calc(20%_-_13px)]"
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
