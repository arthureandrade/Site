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

export default function OfertaCarouselRow({
  produtos = [],
  desconto = 0,
  badge = 'Online',
  cardVariant = 'default',
  itemKeyPrefix = 'oferta',
  accent = 'red',
}) {
  const [inicio, setInicio] = useState(0)
  const [visibleCount, setVisibleCount] = useState(getVisibleCount)

  useEffect(() => {
    function handleResize() {
      setVisibleCount(getVisibleCount())
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (produtos.length <= 1) return undefined
    const timer = window.setInterval(() => {
      setInicio((atual) => (atual + 1) % produtos.length)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [produtos.length])

  useEffect(() => {
    if (!produtos.length) {
      setInicio(0)
      return
    }
    setInicio((atual) => atual % produtos.length)
  }, [produtos.length, visibleCount])

  const visibles = useMemo(() => {
    if (!produtos.length) return []
    const total = Math.min(visibleCount, produtos.length)
    return Array.from({ length: total }, (_, offset) => produtos[(inicio + offset) % produtos.length])
  }, [produtos, inicio, visibleCount])

  const accents =
    accent === 'orange'
      ? {
          button: 'border-orange-200 bg-white text-[#ff5a0a] hover:bg-orange-50',
          dotOn: 'bg-[#ff5a0a]',
          dotOff: 'bg-orange-200',
        }
      : accent === 'green'
      ? {
          button: 'border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50',
          dotOn: 'bg-emerald-600',
          dotOff: 'bg-emerald-200',
        }
      : accent === 'blue'
      ? {
          button: 'border-sky-200 bg-white text-sky-700 hover:bg-sky-50',
          dotOn: 'bg-sky-600',
          dotOff: 'bg-sky-200',
        }
      : {
          button: 'border-red-200 bg-white text-primary hover:bg-red-50',
          dotOn: 'bg-primary',
          dotOff: 'bg-red-200',
        }

  if (!produtos.length) return null

  return (
    <div className="relative">
      {produtos.length > visibleCount && (
        <>
          <button
            type="button"
            onClick={() => setInicio((atual) => (atual === 0 ? produtos.length - 1 : atual - 1))}
            className={`absolute left-[-6px] top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border text-2xl font-black shadow-md transition lg:flex ${accents.button}`}
            aria-label="Anterior"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setInicio((atual) => (atual + 1) % produtos.length)}
            className={`absolute right-[-6px] top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border text-2xl font-black shadow-md transition lg:flex ${accents.button}`}
            aria-label="Proximo"
          >
            ›
          </button>
        </>
      )}

      <div className="flex flex-nowrap gap-3 overflow-hidden sm:gap-4">
        {visibles.map((produto, indice) => (
          <div key={`${itemKeyPrefix}-${produto.id}-${inicio}-${indice}`} className="min-w-0 flex-1">
            <OfertaCard
              produto={produto}
              desconto={desconto}
              badge={badge}
              destaque={indice === 0}
              variant={cardVariant}
            />
          </div>
        ))}
      </div>

      {produtos.length > visibleCount && (
        <div className="mt-5 flex items-center justify-center gap-2">
          {produtos.map((produto, indice) => (
            <button
              key={`${itemKeyPrefix}-dot-${produto.id}-${indice}`}
              type="button"
              onClick={() => setInicio(indice)}
              className={`h-2.5 rounded-full transition-all ${indice === inicio ? `w-8 ${accents.dotOn}` : `w-2.5 ${accents.dotOff}`}`}
              aria-label={`Ir para produto ${indice + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
