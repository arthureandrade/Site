'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useCart } from '@/context/CartContext'
import { formatarParcelamento, formatarPreco, imagemUrlProduto, whatsappLink } from '@/lib/api'
import { calcularPrecoPromocional, obterDescontoPromocional } from '@/lib/ofertas'

export default function ProductCard({ produto, badgeLabel = '', ocultarPreco = false }) {
  const foto = imagemUrlProduto(produto)
  const ocultarEstoque = ocultarPreco
  const temEstoque = Number(produto.estoque || 0) > 0
  const desconto = obterDescontoPromocional(produto)
  const precoOriginal = Number(produto.preco || 0)
  const precoPromocional = calcularPrecoPromocional(precoOriginal, desconto)
  const temPreco = !ocultarPreco && Number(produto.preco) > 0
  const parcelamento = temPreco ? formatarParcelamento(precoOriginal, 10) : ''
  const linkWhatsApp = whatsappLink(produto.nome, desconto > 0 ? precoPromocional : precoOriginal)
  const { dispatch } = useCart()
  const [adicionado, setAdicionado] = useState(false)

  function handleAdicionar(e) {
    e.preventDefault()
    e.stopPropagation()
    dispatch({ type: 'ADD', produto })
    setAdicionado(true)
    setTimeout(() => setAdicionado(false), 1500)
  }

  const conteudo = (
    <>
      <Link href={`/produto/${produto.id}`} className="group block">
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-white to-slate-100">
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

          <div className="absolute bottom-3 right-3 rounded-full bg-black/70 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-white shadow">
            Imagem ilustrativa
          </div>

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {!ocultarEstoque && (
            <span className={temEstoque ? 'badge-green shadow' : 'badge-red shadow'}>
              {temEstoque ? 'Pronta entrega' : 'Sob consulta'}
            </span>
          )}
            {desconto > 0 && (
              <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow">
                {desconto}% OFF online
              </span>
            )}
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
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2.5 p-3 sm:gap-3 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
          {produto.marca && produto.marca !== 'GERAL' && (
            <span className="block truncate text-[10px] font-black uppercase tracking-[0.24em] text-primary">
              {produto.marca}
            </span>
          )}
          <span className="text-[10px] font-mono text-gray-400">Cod. {produto.id}</span>
        </div>
          {desconto > 0 && (
            <span className="rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-primary">
              Oferta online
            </span>
          )}
        </div>

        <Link href={`/produto/${produto.id}`} className="group block">
          <h3 className="line-clamp-3 min-h-[3.35rem] text-[13px] font-semibold leading-snug text-gray-900 transition-colors group-hover:text-primary sm:min-h-[3.75rem] sm:text-[15px]">
            {produto.nome}
          </h3>
        </Link>

        <div className="rounded-[18px] border border-gray-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-2.5 shadow-inner shadow-slate-100/70 sm:rounded-[22px] sm:p-3">
          {ocultarPreco ? (
            <>
              <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Preco sob consulta</span>
              <span className="mt-1 block text-[11px] font-bold uppercase tracking-wide text-primary">
                Consulte no WhatsApp
              </span>
            </>
          ) : temPreco ? (
            <>
              {desconto > 0 && (
                <span className="block text-[11px] font-black uppercase tracking-[0.18em] text-gray-400 line-through">
                  De: {formatarPreco(precoOriginal)}
                </span>
              )}
              <span className="block text-[1.35rem] font-black leading-none text-gray-900 sm:text-2xl">
                {formatarPreco(desconto > 0 ? precoPromocional : precoOriginal)}
              </span>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-wide text-primary sm:text-[11px]">
                {desconto > 0 ? 'a vista no online' : `ou ${parcelamento}`}
              </span>
              {desconto > 0 && (
                <span className="mt-1 block text-[10px] font-bold text-gray-600 sm:text-[11px]">
                  ou {parcelamento} sem juros no valor cheio
                </span>
              )}
            </>
          ) : (
            <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Consultar preco</span>
          )}

          {!ocultarEstoque && temEstoque && (
            <span className="mt-2 block text-[11px] text-gray-500">
              {produto.estoque >= 1000
                ? `${(produto.estoque / 1000).toFixed(0)}k un. disponiveis`
                : `${produto.estoque} un. disponiveis`}
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
          {ocultarPreco ? (
            <a
              href={linkWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
                className="rounded-xl bg-green-500 px-3 py-2 text-center text-[11px] font-black uppercase tracking-wide text-white transition-all duration-200 hover:bg-green-600 sm:text-xs"
              >
                Comprar
              </a>
            ) : (
              <Link
                href={`/produto/${produto.id}`}
                className="rounded-xl bg-primary px-3 py-2 text-center text-[11px] font-black uppercase tracking-wide text-white transition-all duration-200 hover:bg-red-700 sm:text-xs"
              >
                Comprar
              </Link>
            )}
            <button
              type="button"
              onClick={handleAdicionar}
              className={`rounded-xl px-3 py-2 text-[11px] font-black uppercase tracking-wide transition-all duration-200 active:scale-95 sm:text-xs ${
                adicionado
                  ? 'bg-green-100 text-green-700'
                  : 'border border-primary text-primary hover:bg-red-50'
              }`}
            >
              {adicionado ? 'Adicionado' : 'Adicionar'}
            </button>
          </div>
        </div>
      </div>
    </>
  )

  if (ocultarPreco) {
    return <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">{conteudo}</div>
  }

  return (
    <div
      className={`group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl ${
        desconto > 0
          ? 'border-2 border-primary ring-2 ring-red-100 hover:border-primary'
          : 'border border-gray-200 hover:border-primary/30'
      }`}
    >
      {conteudo}
    </div>
  )
}
