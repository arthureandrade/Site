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
  variant = 'default',
  compacto = false,
}) {
  const foto = imagemUrlProduto(produto)
  const precoOriginal = Number(produto?.preco || 0)
  const precoComDesconto = calcularPrecoPromocional(precoOriginal, desconto)
  const parcelamento = precoOriginal > 0 ? formatarParcelamento(precoOriginal, 10) : ''
  const { dispatch } = useCart()
  const [adicionado, setAdicionado] = useState(false)
  const isMotor = variant === 'motor'
  const isFarm = variant === 'farm'

  const styles = isMotor
    ? {
        card: 'border-slate-700/70 bg-[linear-gradient(180deg,#111827_0%,#0f172a_100%)] shadow-[0_20px_50px_rgba(2,6,23,0.35)] hover:border-sky-400/60 hover:shadow-[0_28px_60px_rgba(14,116,144,0.2)]',
        top: 'bg-[linear-gradient(90deg,#0f172a_0%,#1e3a8a_45%,#0ea5e9_100%)]',
        badge: 'bg-white/15 text-white',
        imageWrap: 'border-slate-700/70 bg-[radial-gradient(circle_at_top,#1e293b_0%,#0f172a_85%)]',
        brand: 'text-sky-300',
        code: 'border-slate-600 bg-slate-800/80 text-slate-200',
        hint: 'text-sky-200/90',
        title: 'text-white',
        priceBox: 'border-slate-700 bg-[linear-gradient(180deg,#0f172a_0%,#111827_100%)] shadow-inner shadow-slate-950/40',
        old: 'text-slate-400',
        save: 'bg-sky-500/15 text-sky-200',
        currency: 'text-sky-300',
        price: 'text-white',
        vista: 'text-emerald-300',
        online: 'text-sky-200',
        parcel: 'text-slate-200',
        stock: 'border-sky-500/20 bg-sky-500/10 text-sky-100',
        buy: 'bg-[linear-gradient(90deg,#22c55e_0%,#16a34a_100%)] text-white shadow-[0_12px_30px_rgba(34,197,94,0.25)]',
        add: adicionado ? 'bg-emerald-100 text-emerald-700' : 'border border-sky-400/60 text-sky-100 hover:bg-sky-500/10',
      }
    : isFarm
    ? {
        card: 'border-emerald-900/40 bg-[linear-gradient(180deg,#153b26_0%,#0d2518_100%)] shadow-[0_20px_54px_rgba(5,46,22,0.3)] hover:border-lime-300/60 hover:shadow-[0_28px_60px_rgba(34,197,94,0.18)]',
        top: 'bg-[linear-gradient(90deg,#14532d_0%,#15803d_48%,#65a30d_100%)]',
        badge: 'bg-white/15 text-white',
        imageWrap: 'border-emerald-900/40 bg-[radial-gradient(circle_at_top,#355f3d_0%,#163322_62%,#102418_100%)]',
        brand: 'text-lime-300',
        code: 'border-emerald-700/60 bg-emerald-950/55 text-emerald-100',
        hint: 'text-lime-100/85',
        title: 'text-white',
        priceBox: 'border-emerald-800/70 bg-[linear-gradient(180deg,#102418_0%,#163322_100%)] shadow-inner shadow-emerald-950/50',
        old: 'text-emerald-100/45',
        save: 'bg-lime-400/12 text-lime-200',
        currency: 'text-lime-300',
        price: 'text-white',
        vista: 'text-lime-300',
        online: 'text-emerald-100',
        parcel: 'text-emerald-50/90',
        stock: 'border-lime-400/20 bg-lime-400/10 text-lime-100',
        buy: 'bg-[linear-gradient(90deg,#84cc16_0%,#65a30d_100%)] text-emerald-950 shadow-[0_12px_30px_rgba(132,204,22,0.22)]',
        add: adicionado ? 'bg-lime-100 text-lime-800' : 'border border-lime-300/60 text-lime-100 hover:bg-lime-300/10',
      }
    : {
        card: 'border-red-100 bg-white shadow-[0_16px_38px_rgba(15,23,42,0.08)] hover:border-primary/30 hover:shadow-[0_24px_48px_rgba(15,23,42,0.12)]',
        top: 'bg-gradient-to-r from-brand via-primary to-red-500',
        badge: 'bg-white/20 text-white',
        imageWrap: 'border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]',
        brand: 'text-primary',
        code: 'border-slate-200 bg-slate-50 text-slate-500',
        hint: 'text-slate-400',
        title: 'text-slate-900',
        priceBox: 'border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] shadow-inner shadow-slate-100/70',
        old: 'text-slate-400',
        save: 'bg-red-50 text-primary',
        currency: 'text-primary',
        price: 'text-slate-900',
        vista: 'text-primary',
        online: 'text-primary',
        parcel: 'text-slate-700',
        stock: 'border-emerald-100 bg-emerald-50/70 text-emerald-700',
        buy: 'bg-brand text-white shadow-[0_12px_26px_rgba(15,23,42,0.14)]',
        add: adicionado ? 'bg-green-100 text-green-700' : 'border border-primary text-primary hover:bg-red-50',
      }

  function handleAdicionar() {
    dispatch({ type: 'ADD', produto })
    setAdicionado(true)
    setTimeout(() => setAdicionado(false), 1500)
  }

  return (
    <div
      className={`group flex h-full flex-col overflow-hidden rounded-[20px] border transition hover:-translate-y-1 sm:rounded-[26px] ${
        styles.card
      } ${
        destaque ? (compacto ? 'lg:min-h-[430px]' : 'lg:min-h-[540px]') : ''
      }`}
    >
      <div className={`text-white ${compacto ? 'px-3 py-2 sm:px-3.5 sm:py-2.5' : 'px-3 py-2.5 sm:px-4 sm:py-3'} ${styles.top}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="leading-none">
            <span className={`${compacto ? 'text-[1.45rem] sm:text-[2.2rem]' : 'text-[1.9rem] sm:text-5xl'} font-black`}>{desconto}%</span>
            <span className={`ml-1.5 inline-block font-black uppercase ${compacto ? 'text-[10px] sm:text-sm' : 'text-xs sm:ml-2 sm:text-lg'}`}>de desconto</span>
          </div>
          <span className={`rounded-full font-black uppercase ${compacto ? 'px-2 py-1 text-[8px] tracking-[0.14em] sm:text-[9px]' : 'px-2 py-1 text-[9px] tracking-[0.18em] sm:px-3 sm:text-[10px] sm:tracking-[0.22em]'} ${styles.badge}`}>
            {badge}
          </span>
        </div>
      </div>

      <Link href={`/produto/${produto.id}`} className={`relative block overflow-hidden rounded-xl border ${compacto ? 'mx-2 mt-2 sm:mx-2.5 sm:mt-2.5' : 'mx-2 mt-2 sm:mx-3 sm:mt-3'} sm:rounded-2xl ${styles.imageWrap}`}>
        <div className={`relative ${compacto ? 'aspect-[1.28/1]' : 'aspect-[1.1/1]'}`}>
          {foto ? (
            <Image
              src={foto}
              alt={produto.nome}
              fill
              unoptimized
              className={`object-contain transition-transform duration-300 group-hover:scale-105 ${compacto ? 'p-3' : 'p-4'}`}
              sizes="(max-width: 768px) 50vw, 20vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-slate-100 text-sm font-bold uppercase tracking-wide text-slate-400">
              Sem foto
            </div>
          )}

          <div className={`absolute rounded-full bg-black/70 font-black uppercase text-white shadow ${compacto ? 'bottom-2 right-2 px-2 py-0.5 text-[8px] tracking-[0.14em]' : 'bottom-3 right-3 px-2.5 py-1 text-[9px] tracking-[0.18em]'}`}>
            Imagem ilustrativa
          </div>
        </div>
      </Link>

      <div className={`flex flex-1 flex-col text-slate-900 ${compacto ? 'px-3 pb-3 pt-2.5 sm:px-3.5 sm:pb-4 sm:pt-3' : 'px-3 pb-4 pt-3 sm:px-4 sm:pb-5 sm:pt-4'}`}>
        <div className={`flex items-center justify-between gap-2 ${compacto ? 'mb-1.5 sm:mb-2' : 'mb-2 sm:mb-3'}`}>
          <div className={`${compacto ? 'text-[9px] tracking-[0.18em]' : 'text-[10px] tracking-[0.22em]'} font-black uppercase ${styles.brand}`}>
            {produto.marca || 'Galpao do Aco'}
          </div>
          <span className={`rounded-full border font-black uppercase ${compacto ? 'px-2 py-0.5 text-[8px] tracking-[0.1em] sm:text-[9px]' : 'px-2 py-1 text-[9px] tracking-[0.12em] sm:px-2.5 sm:text-[10px] sm:tracking-[0.16em]'} ${styles.code}`}>
            Cod. {produto.id}
          </span>
        </div>

        {!compacto && (
          <div className={`mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] sm:text-[11px] sm:tracking-[0.16em] ${styles.hint}`}>
            Oferta valida para compras online
          </div>
        )}

        <Link href={`/produto/${produto.id}`} className="block">
          <h3 className={`font-black leading-tight ${compacto ? 'line-clamp-2 min-h-[2.1rem] text-[11px] sm:min-h-[2.5rem] sm:text-[12px]' : 'line-clamp-3 min-h-[3.8rem] text-sm sm:min-h-[4.8rem] sm:text-[1.05rem]'} ${styles.title}`}>
            {produto.nome}
          </h3>
        </Link>

        <div className={`rounded-[18px] border ${compacto ? 'mt-2.5 p-2.5 sm:mt-3 sm:p-3' : 'mt-3 p-3 sm:mt-4 sm:rounded-[22px] sm:p-4'} ${styles.priceBox}`}>
          <div className="flex items-center justify-between gap-3">
            {compacto ? (
              <div className={`text-[8px] font-black uppercase tracking-[0.1em] ${styles.old}`}>
                De: {formatarPreco(precoOriginal)}
              </div>
            ) : (
              <>
                <div className="text-[11px] font-black uppercase line-through decoration-2 sm:text-sm">
                  <span className={styles.old}>De: {formatarPreco(precoOriginal)}</span>
                </div>
                <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] sm:px-2.5 sm:text-[10px] sm:tracking-[0.16em] ${styles.save}`}>
                  economia imediata
                </span>
              </>
            )}
          </div>
          <div className={`flex items-end gap-1.5 ${compacto ? 'mt-1.5 sm:gap-1.5' : 'mt-2 sm:gap-2'}`}>
            <span className={`${compacto ? 'text-sm sm:text-base' : 'text-lg sm:text-xl'} font-black ${styles.currency}`}>R$</span>
            <span className={`${compacto ? 'text-[1.35rem] sm:text-[1.7rem]' : 'text-[1.9rem] sm:text-4xl'} font-black leading-none ${styles.price}`}>
              {formatarPreco(precoComDesconto).replace('R$', '').trim()}
            </span>
            <span className={`${compacto ? 'pb-0.5 text-[8px] tracking-[0.1em] sm:text-[9px]' : 'pb-1 text-[10px] tracking-[0.14em] sm:text-xs sm:tracking-[0.18em]'} font-black uppercase ${styles.vista}`}>
              a vista
            </span>
          </div>
          <div className={`${compacto ? 'mt-1 text-[8px] sm:text-[9px]' : 'mt-2 text-[11px] sm:mt-3 sm:text-sm'} font-bold ${styles.online}`}>
            {compacto ? 'Online' : 'Oferta valida para compras online'}
          </div>
          <div className={`${compacto ? 'mt-1 text-[8px] sm:text-[9px]' : 'mt-2 text-[11px] sm:text-sm'} font-semibold ${styles.parcel}`}>
            ou {parcelamento} sem juros no valor cheio
          </div>
        </div>

        {!compacto && (
          <div className={`mt-3 rounded-xl border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] sm:mt-4 sm:rounded-2xl sm:text-[11px] sm:tracking-[0.16em] ${styles.stock}`}>
            Estoque real e retirada rapida
          </div>
        )}

        <div className={`mt-auto grid grid-cols-1 gap-2 sm:grid-cols-2 ${compacto ? 'pt-3 sm:pt-4' : 'pt-4 sm:pt-5'}`}>
          <Link
            href={`/produto/${produto.id}`}
            className={`rounded-xl text-center font-black uppercase ${compacto ? 'px-3 py-2 text-[10px] tracking-[0.14em] sm:px-3.5 sm:text-[11px]' : 'px-3 py-2.5 text-[11px] tracking-[0.16em] sm:px-4 sm:py-3 sm:text-xs sm:tracking-[0.2em]'} ${styles.buy}`}
          >
            Comprar
          </Link>
          <button
            type="button"
            onClick={handleAdicionar}
            className={`rounded-xl font-black uppercase transition ${compacto ? 'px-3 py-2 text-[10px] tracking-[0.14em] sm:px-3.5 sm:text-[11px]' : 'px-3 py-2.5 text-[11px] tracking-[0.16em] sm:px-4 sm:py-3 sm:text-xs sm:tracking-[0.2em]'} ${styles.add}`}
          >
            {adicionado ? 'Adicionado' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  )
}
