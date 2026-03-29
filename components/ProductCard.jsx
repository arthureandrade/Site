'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useCart } from '@/context/CartContext'
import { formatarParcelamento, formatarPreco, imagemUrl } from '@/lib/api'

export default function ProductCard({ produto, badgeLabel = '' }) {
  const foto = imagemUrl(produto.foto_url)
  const temEstoque = produto.estoque > 0
  const temPreco = Number(produto.preco) > 0
  const parcelamento = temPreco ? formatarParcelamento(produto.preco, 10) : ''
  const { dispatch } = useCart()
  const [adicionado, setAdicionado] = useState(false)

  function handleAdicionar(e) {
    e.preventDefault()
    e.stopPropagation()
    dispatch({ type: 'ADD', produto })
    setAdicionado(true)
    setTimeout(() => setAdicionado(false), 1500)
  }

  return (
    <Link
      href={`/produto/${produto.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl"
    >
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        {foto ? (
          <Image
            src={foto}
            alt={produto.nome}
            fill
            unoptimized
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-brand/95 text-white">
            <svg className="h-14 w-14 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"
              />
            </svg>
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-white/60">Sem foto</span>
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className={temEstoque ? 'badge-green shadow' : 'badge-red shadow'}>
            {temEstoque ? 'Pronta entrega' : 'Sob consulta'}
          </span>
          {badgeLabel && (
            <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow">
              {badgeLabel}
            </span>
          )}
          {temPreco && (
            <span className="rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-gray-900 shadow">
              10x sem juros
            </span>
          )}
        </div>

        <button
          onClick={handleAdicionar}
          className={`absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-all duration-200 active:scale-90 ${
            adicionado ? 'bg-green-500 text-white' : 'bg-primary text-white hover:bg-red-700'
          }`}
          title="Adicionar ao carrinho"
        >
          {adicionado ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          )}
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          {produto.marca && produto.marca !== 'GERAL' && (
            <span className="block truncate text-[10px] font-black uppercase tracking-[0.24em] text-primary">
              {produto.marca}
            </span>
          )}
          <span className="text-[10px] font-mono text-gray-400">Cod. {produto.id}</span>
        </div>

        <h3 className="line-clamp-3 min-h-[3.75rem] text-sm font-semibold leading-snug text-gray-900 transition-colors group-hover:text-primary">
          {produto.nome}
        </h3>

        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
          {temPreco ? (
            <>
              <span className="block text-2xl font-black leading-none text-gray-900">{formatarPreco(produto.preco)}</span>
              <span className="mt-1 block text-[11px] font-bold uppercase tracking-wide text-primary">
                ou {parcelamento}
              </span>
            </>
          ) : (
            <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Consultar preco</span>
          )}

          {temEstoque && (
            <span className="mt-2 block text-[11px] text-gray-500">
              {produto.estoque >= 1000
                ? `${(produto.estoque / 1000).toFixed(0)}k un. disponiveis`
                : `${produto.estoque} un. disponiveis`}
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
          <div className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Compra online</div>

          <button
            onClick={handleAdicionar}
            className={`shrink-0 rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wide transition-all duration-200 active:scale-95 ${
              adicionado ? 'bg-green-100 text-green-700' : 'bg-primary text-white hover:bg-red-700'
            }`}
          >
            {adicionado ? 'Adicionado' : 'Comprar'}
          </button>
        </div>
      </div>
    </Link>
  )
}
