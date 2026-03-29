'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useCart } from '@/context/CartContext'
import { formatarParcelamento, formatarPreco, imagemUrl } from '@/lib/api'
import { calcularPrecoPromocional } from '@/lib/ofertas'

export default function OfertaCard({
  produto,
  desconto = 0,
  badge = 'Oferta online',
  destaque = false,
}) {
  const foto = imagemUrl(produto?.foto_url)
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
      className={`group flex h-full flex-col overflow-hidden rounded-[26px] border border-red-200 bg-white shadow-[0_14px_35px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_20px_40px_rgba(15,23,42,0.12)] ${
        destaque ? 'lg:min-h-[540px]' : ''
      }`}
    >
      <div className="bg-gradient-to-r from-primary to-red-500 px-4 py-3 text-white">
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

      <Link href={`/produto/${produto.id}`} className="relative mx-3 mt-3 block overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
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
        <div className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-primary">
          {produto.marca || 'Galpao do Aco'}
        </div>

        <Link href={`/produto/${produto.id}`} className="block">
          <h3 className="line-clamp-3 min-h-[4.8rem] text-lg font-black leading-tight">
            {produto.nome}
          </h3>
        </Link>

        <div className="mt-4 rounded-2xl bg-slate-50 p-4">
          <div className="text-sm font-black uppercase text-slate-400 line-through decoration-2">
            De: {formatarPreco(precoOriginal)}
          </div>
          <div className="mt-1 flex items-end gap-2">
            <span className="text-xl font-black text-primary">R$</span>
            <span className="text-4xl font-black leading-none text-slate-900">
              {formatarPreco(precoComDesconto).replace('R$', '').trim()}
            </span>
            <span className="pb-1 text-xs font-black uppercase tracking-[0.18em] text-primary">
              a vista
            </span>
          </div>
          <div className="mt-2 text-sm font-bold text-primary">
            Oferta valida para compras online
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-700">
            ou {parcelamento} sem juros no valor cheio
          </div>
        </div>

        <div className="mt-auto grid grid-cols-1 gap-2 pt-5 sm:grid-cols-2">
          <Link
            href={`/produto/${produto.id}`}
            className="rounded-xl bg-brand px-4 py-3 text-center text-xs font-black uppercase tracking-[0.2em] text-white"
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
