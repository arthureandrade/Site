'use client'

import { useMemo, useState } from 'react'
import OfertaCard from '@/components/OfertaCard'

function chunk(lista, tamanho) {
  const grupos = []
  for (let i = 0; i < lista.length; i += tamanho) {
    grupos.push(lista.slice(i, i + tamanho))
  }
  return grupos
}

export default function SaldaoCarousel({ produtos = [] }) {
  const paginas = useMemo(() => chunk(produtos, 5), [produtos])
  const [pagina, setPagina] = useState(0)

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

  const paginaAtual = paginas[pagina] || []

  return (
    <div className="relative">
      {paginas.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setPagina((atual) => (atual === 0 ? paginas.length - 1 : atual - 1))}
            className="absolute left-[-6px] top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-orange-200 bg-white text-2xl font-black text-[#ff5a0a] shadow-md lg:flex"
            aria-label="Pagina anterior"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setPagina((atual) => (atual === paginas.length - 1 ? 0 : atual + 1))}
            className="absolute right-[-6px] top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-orange-200 bg-white text-2xl font-black text-[#ff5a0a] shadow-md lg:flex"
            aria-label="Proxima pagina"
          >
            ›
          </button>
        </>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {paginaAtual.map((produto) => (
          <OfertaCard
            key={`saldao-${produto.id}`}
            produto={produto}
            desconto={18}
            badge="Saldão online"
          />
        ))}
      </div>

      {paginas.length > 1 && (
        <div className="mt-5 flex items-center justify-center gap-2">
          {paginas.map((_, indice) => (
            <button
              key={`dot-${indice}`}
              type="button"
              onClick={() => setPagina(indice)}
              className={`h-2.5 rounded-full transition-all ${
                indice === pagina ? 'w-8 bg-[#ff5a0a]' : 'w-2.5 bg-orange-200'
              }`}
              aria-label={`Ir para pagina ${indice + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
