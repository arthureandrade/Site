'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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
  autoScroll = false,
}) {
  const [manualOverride, setManualOverride] = useState(false)
  const resumeTimerRef = useRef(null)

  const autoRunning = autoScroll && !manualOverride

  const trackItems = useMemo(() => {
    if (!produtos.length) return []
    return autoRunning ? [...produtos, ...produtos] : produtos
  }, [produtos, autoRunning])

  if (!produtos.length) return null

  const duration = `${getDuration(produtos.length)}s`

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current)
      }
    }
  }, [])

  function ativarModoManualTemporario() {
    if (!autoScroll) return
    setManualOverride(true)
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current)
    }
    resumeTimerRef.current = setTimeout(() => {
      setManualOverride(false)
    }, 8000)
  }

  return (
    <div
      className={autoRunning ? 'marquee-wrapper' : 'overflow-x-auto pb-3'}
      onWheel={ativarModoManualTemporario}
      onTouchStart={ativarModoManualTemporario}
      onMouseDown={ativarModoManualTemporario}
      onScroll={ativarModoManualTemporario}
    >
      <div
        className={`${autoRunning ? 'marquee-track' : 'flex'} gap-3 sm:gap-4`}
        style={{
          animationDuration: autoRunning ? duration : undefined,
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
