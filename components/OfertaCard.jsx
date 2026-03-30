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
      className={`group flex h-full flex-col overflow-hidden rounded-[26px] border border-red-100 bg-white shadow-[0_16px_38px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_24px_48px_rgba(15,23,42,0.12)] ${
        destaque ? 'lg:min-h-[540px]' : ''
      }`}
    >
      <div className="bg-gradient-to-r from-brand via-primary to-red-500 px-4 py-3 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="leading-none">
            <span className="text-4xl font-black sm:text-5xl">{desconto}%</span>
            <span className="ml-2 inline-block text-lg font-black uppercase">de desconto</span>
          </div>
          <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em]">
            {badge}
          </span>
        </div>
      </div>

      <Link href={`/produto/${produto.id}`} className="relative mx-3 mt-3 block overflow-hidden rounded-2xl border border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
        <div className="relative aspect-[1.1/1]">
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

      <div className="flex flex-1 flex-col px-4 pb-5 pt-4 text-slate-900">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">
            {produto.marca || 'Galpao do Aco'}
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            Cod. {produto.id}
          </span>
        </div>

        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          Oferta valida para compras online
        </div>

        <Link href={`/produto/${produto.id}`} className="block">
          <h3 className="line-clamp-3 min-h-[4.8rem] text-[1.05rem] font-black leading-tight text-slate-900">
            {produto.nome}
          </h3>
        </Link>

        <div className="mt-4 rounded-[22px] border border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 shadow-inner shadow-slate-100/70">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-black uppercase text-slate-400 line-through decoration-2">
              De: {formatarPreco(precoOriginal)}
            </div>
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-primary">
              economia imediata
            </span>
          </div>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-xl font-black text-primary">R$</span>
            <span className="text-4xl font-black leading-none text-slate-900">
              {formatarPreco(precoComDesconto).replace('R$', '').trim()}
            </span>
            <span className="pb-1 text-xs font-black uppercase tracking-[0.18em] text-primary">
              a vista
            </span>
          </div>
          <div className="mt-3 text-sm font-bold text-primary">
            Oferta valida para compras online
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-700">
            ou {parcelamento} sem juros no valor cheio
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
          Estoque real e retirada rapida
        </div>

        <div className="mt-auto grid grid-cols-1 gap-2 pt-5 sm:grid-cols-2">
          <Link
            href={`/produto/${produto.id}`}
            className="rounded-xl bg-brand px-4 py-3 text-center text-xs font-black uppercase tracking-[0.2em] text-white shadow-[0_12px_26px_rgba(15,23,42,0.14)]"
          >
            Comprar
          </Link>
          <button
            type="button"
            onClick={handleAdicionar}
            className={`rounded-xl px-4 py-3 text-xs font-black uppercase tracking-[0.2em] transition ${
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
