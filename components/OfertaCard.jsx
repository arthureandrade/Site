'use client'

import Image from 'next/image'
import Link from 'next/link'
import { formatarParcelamento, formatarPreco, imagemUrl } from '@/lib/api'

function calcularPrecoComDesconto(preco, desconto) {
  const valor = Number(preco || 0)
  if (valor <= 0) return 0
  return valor * (1 - desconto / 100)
}

export default function OfertaCard({
  produto,
  desconto = 0,
  badge = 'Oferta online',
  destaque = false,
}) {
  const foto = imagemUrl(produto?.foto_url)
  const precoOriginal = Number(produto?.preco || 0)
  const precoComDesconto = calcularPrecoComDesconto(precoOriginal, desconto)
  const parcelamento = precoComDesconto > 0 ? formatarParcelamento(precoComDesconto, 10) : ''

  return (
    <Link
      href={`/produto/${produto.id}`}
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

      <div className="relative mx-3 mt-3 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
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
      </div>

      <div className="flex flex-1 flex-col px-4 pb-5 pt-4 text-slate-900">
        <div className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-primary">
          {produto.marca || 'Galpao do Aco'}
        </div>

        <h3 className="line-clamp-3 min-h-[4.8rem] text-lg font-black leading-tight">
          {produto.nome}
        </h3>

        <div className="mt-4 rounded-2xl bg-slate-50 p-4">
          <div className="text-sm font-black uppercase text-slate-400 line-through decoration-2">
            De: {formatarPreco(precoOriginal)}
          </div>
          <div className="mt-1 flex items-end gap-2">
            <span className="text-xl font-black text-primary">R$</span>
            <span className="text-4xl font-black leading-none text-slate-900">
              {formatarPreco(precoComDesconto).replace('R$', '').trim()}
            </span>
          </div>
          <div className="mt-2 text-sm font-bold text-primary">
            Oferta valida para compras online
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-700">
            ou {parcelamento} sem juros
          </div>
        </div>

        <div className="mt-auto pt-5">
          <span className="inline-flex rounded-xl bg-brand px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-white">
            Comprar agora
          </span>
        </div>
      </div>
    </Link>
  )
}
