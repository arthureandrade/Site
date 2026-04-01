'use client'

import OfertaCarouselRow from '@/components/OfertaCarouselRow'

export default function SaldaoCarousel({ produtos = [] }) {
  if (!produtos.length) {
    return (
      <div className="rounded-[28px] border border-dashed border-orange-300 bg-orange-50 px-6 py-10 text-center">
        <div className="text-sm font-black uppercase tracking-[0.24em] text-[#16246f]">
          Nenhum produto no saldao agora
        </div>
        <div className="mt-2 text-sm text-slate-600">
          Assim que houver itens com preco no subgrupo 25, eles entram automaticamente aqui.
        </div>
      </div>
    )
  }

  return (
    <OfertaCarouselRow
      produtos={produtos}
      desconto={18}
      badge="Saldao online"
      itemKeyPrefix="saldao"
      accent="orange"
    />
  )
}
