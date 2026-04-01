'use client'

import { useMemo } from 'react'
import OfertaCard from '@/components/OfertaCard'

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
            className="w-[168px] shrink-0 sm:w-[220px] lg:w-[250px] xl:w-[272px]"
          >
            <OfertaCard
              produto={produto}
              desconto={desconto}
              badge={badge}
              destaque={indice % produtos.length === 0}
              variant={cardVariant}
              compacto
            />
          </div>
        ))}
      </div>
    </div>
  )
}
