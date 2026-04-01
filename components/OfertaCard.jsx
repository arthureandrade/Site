'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useCart } from '@/context/CartContext'
import { formatarParcelamento, formatarPreco, imagemUrlProduto } from '@/lib/api'
import { calcularPrecoPromocional } from '@/lib/ofertas'

export default function OfertaCard({
  produto,
  desconto = 0,
  badge = 'Oferta online',
  destaque = false,
  compacto = false,
}) {
  const foto = imagemUrlProduto(produto)
  const precoOriginal = Number(produto?.preco || 0)
  const precoComDesconto = calcularPrecoPromocional(precoOriginal, desconto)
  const parcelamento = precoOriginal > 0 ? formatarParcelamento(precoOriginal, 10) : ''
  const { dispatch } = useCart()
  const [adicionado, setAdicionado] = useState(false)

  function handleAdicionar() {
    dispatch({ type: 'ADD', produto })
    setAdicionado(true)
    setTimeout(() => setAdicionado(false), 1500)
  }

  return (
    <div
      className={`group flex h-full flex-col overflow-hidden rounded-[20px] border border-red-100 bg-white shadow-[0_16px_38px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_24px_48px_rgba(15,23,42,0.12)] sm:rounded-[26px] ${
        destaque ? 'lg:min-h-[500px]' : ''
      }`}
    >
      <div className="bg-gradient-to-r from-brand via-primary to-red-500 px-3 py-2.5 text-white sm:px-4 sm:py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="leading-none">
            <span className="text-[1.9rem] font-black sm:text-5xl">{desconto}%</span>
            <span className="ml-1.5 inline-block text-xs font-black uppercase sm:ml-2 sm:text-lg">de desconto</span>
          </div>
          <span className="rounded-full bg-white/20 px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] sm:px-3 sm:text-[10px] sm:tracking-[0.22em]">
            {badge}
          </span>
        </div>
      </div>

      <Link href={`/produto/${produto.id}`} className="relative mx-2 mt-2 block overflow-hidden rounded-xl border border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] sm:mx-3 sm:mt-3 sm:rounded-2xl">
        <div className={`relative ${compacto ? 'aspect-[1.2/0.92]' : 'aspect-[1.1/1]'}`}>
          {foto ? (
            <Image
              src={foto}
              alt={produto.nome}
              fill
              unoptimized
              className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 20vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-slate-100 text-sm font-bold uppercase tracking-wide text-slate-400">
              Sem foto
            </div>
          )}
        </div>
      </Link>

      <div className={`flex flex-1 flex-col px-3 text-slate-900 sm:px-4 ${compacto ? 'pb-3 pt-2.5 sm:pb-4 sm:pt-3' : 'pb-4 pt-3 sm:pb-5 sm:pt-4'}`}>
        <div className="mb-2 flex items-center justify-between gap-2 sm:mb-3">
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">
            {produto.marca || 'Galpao do Aco'}
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-slate-500 sm:px-2.5 sm:text-[10px] sm:tracking-[0.16em]">
            Cod. {produto.id}
          </span>
        </div>

        <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 sm:text-[11px] sm:tracking-[0.16em]">
          Oferta valida para compras online
        </div>

        <Link href={`/produto/${produto.id}`} className="block">
          <h3 className={`line-clamp-3 font-black leading-tight text-slate-900 ${compacto ? 'min-h-[3.1rem] text-[13px] sm:min-h-[3.6rem] sm:text-[15px]' : 'min-h-[3.8rem] text-sm sm:min-h-[4.8rem] sm:text-[1.05rem]'}`}>
            {produto.nome}
          </h3>
        </Link>

        <div className={`rounded-[18px] border border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] shadow-inner shadow-slate-100/70 sm:rounded-[22px] ${compacto ? 'mt-2 p-2.5 sm:mt-3 sm:p-3' : 'mt-3 p-3 sm:mt-4 sm:p-4'}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="text-[11px] font-black uppercase text-slate-400 line-through decoration-2 sm:text-sm">
              De: {formatarPreco(precoOriginal)}
            </div>
            <span className="rounded-full bg-red-50 px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-primary sm:px-2.5 sm:text-[10px] sm:tracking-[0.16em]">
              economia imediata
            </span>
          </div>
          <div className="mt-2 flex items-end gap-1.5 sm:gap-2">
            <span className="text-lg font-black text-primary sm:text-xl">R$</span>
            <span className="text-[1.9rem] font-black leading-none text-slate-900 sm:text-4xl">
              {formatarPreco(precoComDesconto).replace('R$', '').trim()}
            </span>
            <span className="pb-1 text-[10px] font-black uppercase tracking-[0.14em] text-primary sm:text-xs sm:tracking-[0.18em]">
              a vista
            </span>
          </div>
          <div className={`font-bold text-primary ${compacto ? 'mt-1.5 text-[10px] sm:mt-2 sm:text-[11px]' : 'mt-2 text-[11px] sm:mt-3 sm:text-sm'}`}>
            Oferta valida para compras online
          </div>
          <div className={`font-semibold text-slate-700 ${compacto ? 'mt-1.5 text-[10px] sm:text-[11px]' : 'mt-2 text-[11px] sm:text-sm'}`}>
            ou {parcelamento} sem juros no valor cheio
          </div>
        </div>

        <div className={`rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700 sm:rounded-2xl sm:text-[11px] sm:tracking-[0.16em] ${compacto ? 'mt-2.5' : 'mt-3 sm:mt-4'}`}>
          Estoque real e retirada rapida
        </div>

        <div className={`mt-auto grid grid-cols-1 gap-2 sm:grid-cols-2 ${compacto ? 'pt-3 sm:pt-4' : 'pt-4 sm:pt-5'}`}>
          <Link
            href={`/produto/${produto.id}`}
            className="rounded-xl bg-brand px-3 py-2.5 text-center text-[11px] font-black uppercase tracking-[0.16em] text-white shadow-[0_12px_26px_rgba(15,23,42,0.14)] sm:px-4 sm:py-3 sm:text-xs sm:tracking-[0.2em]"
          >
            Comprar
          </Link>
          <button
            type="button"
            onClick={handleAdicionar}
            className={`rounded-xl px-3 py-2.5 text-[11px] font-black uppercase tracking-[0.16em] transition sm:px-4 sm:py-3 sm:text-xs sm:tracking-[0.2em] ${
              adicionado ? 'bg-green-100 text-green-700' : 'border border-primary text-primary hover:bg-red-50'
            }`}
          >
            {adicionado ? 'Adicionado' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  )
}
