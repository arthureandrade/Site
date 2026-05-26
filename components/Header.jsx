'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { API_URL } from '@/lib/api'

export default function Header() {
  const [logoUrl, setLogoUrl] = useState('/logo.jpeg')
  const [busca, setBusca] = useState('')
  const pathname = usePathname()
  const telefone = '(95) 3224-0115'
  const whatsappAco = `https://wa.me/559532240115?text=${encodeURIComponent('Olá! Quero comprar aço e preciso de atendimento comercial.')}`
  const isVendedorArea = pathname?.startsWith('/vendedor')

  function irParaBusca(e) {
    e.preventDefault()
    const termo = busca.trim()
    if (!termo) {
      window.location.assign('/produtos')
      return
    }
    window.location.assign(`/produtos?busca=${encodeURIComponent(termo)}`)
  }

  useEffect(() => {
    let ativo = true
    fetch(`${API_URL}/home-config`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!ativo) return
        if (data?.logo_url) setLogoUrl(`${API_URL}${data.logo_url}`)
      })
      .catch(() => {})
    return () => {
      ativo = false
    }
  }, [])

  return (
    <header className={`sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md ${isVendedorArea ? 'shadow-[0_6px_20px_rgba(15,23,42,0.05)]' : 'shadow-[0_10px_35px_rgba(15,23,42,0.08)]'}`}>
      <div className="border-b border-slate-200 bg-[#f8fafc]">
        <div
          className={`mx-auto flex max-w-[1600px] flex-col gap-2 px-4 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:px-8 ${
            isVendedorArea ? 'py-1.5 text-[10px] tracking-[0.12em] lg:py-1.5 lg:text-xs' : 'py-2 sm:py-3 lg:text-sm lg:tracking-[0.16em]'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <a href="tel:9532240115" className={isVendedorArea ? 'text-xs text-primary sm:text-sm' : 'text-sm text-primary sm:text-lg'}>{telefone}</a>
            {!isVendedorArea ? (
              <span className="rounded-full bg-green-50 px-2.5 py-1 text-[9px] text-green-700 sm:px-3 sm:text-[10px] lg:inline-flex">
                Atendimento comercial rápido
              </span>
            ) : null}
          </div>
          <div className={`flex flex-wrap gap-y-1 font-bold ${isVendedorArea ? 'gap-x-3 text-[9px] tracking-[0.08em] sm:text-[10px]' : 'gap-x-4 text-[10px] tracking-[0.12em] sm:text-xs lg:text-sm'}`}>
            <span>Av. Ataíde Teive, 5928</span>
            <span>Av. Ataíde Teive, 4509</span>
          </div>
        </div>
      </div>

      <div className={`mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 sm:gap-5 sm:px-6 md:flex-wrap xl:flex-nowrap lg:px-8 ${
        isVendedorArea ? 'py-2 sm:py-2.5 lg:h-20 lg:py-0' : 'py-3 sm:py-4 lg:h-32 lg:py-0'
      }`}>
        <Link href="/" className={`flex items-center ${isVendedorArea ? 'gap-2' : 'gap-3'}`}>
          {logoUrl ? (
            <div className={`relative ${
              isVendedorArea
                ? 'h-[34px] w-[128px] sm:h-[38px] sm:w-[150px] lg:h-[44px] lg:w-[180px]'
                : 'h-[46px] w-[180px] sm:h-[56px] sm:w-[230px] lg:h-[72px] lg:w-[320px]'
            }`}>
              <Image src={logoUrl} alt="Galpão do Aço" fill unoptimized className="object-contain object-left" />
            </div>
          ) : (
            <>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary font-display text-xl leading-none text-white">
                G
              </div>
              <div className="leading-tight">
                <div className="font-display text-lg uppercase tracking-wide text-gray-900">Galpão do Aço</div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-gray-400">Material de construção</div>
              </div>
            </>
          )}
        </Link>

        <div className={`order-3 w-full basis-full px-0 xl:order-none xl:w-auto xl:flex-1 xl:basis-auto ${
          isVendedorArea ? 'hidden md:block md:pt-0 lg:pt-0 xl:px-4 xl:pt-0' : 'pt-1 lg:pt-2 xl:px-6 xl:pt-0'
        }`}>
          <form onSubmit={irParaBusca} className={`mx-auto flex w-full max-w-none items-center gap-2 border border-slate-200 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.06)] ${
            isVendedorArea
              ? 'rounded-[18px] p-1.5 xl:max-w-2xl'
              : 'rounded-[24px] p-2 xl:max-w-3xl'
          }`}>
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, código ou marca..."
              className={`w-full border-0 bg-transparent font-semibold text-slate-700 outline-none transition focus:ring-0 ${
                isVendedorArea ? 'rounded-xl px-3 py-2 text-xs' : 'rounded-2xl px-4 py-3 text-sm lg:py-3.5'
              }`}
            />
            <button
              type="submit"
              className={`bg-brand font-black uppercase text-white transition hover:bg-primary ${
                isVendedorArea
                  ? 'rounded-xl px-4 py-2 text-[11px] tracking-[0.14em]'
                  : 'rounded-2xl px-5 py-3 text-sm tracking-[0.16em] lg:px-6 lg:py-3.5'
              }`}
            >
              Buscar
            </button>
          </form>
        </div>

        <div className="flex items-center gap-3">
          {!isVendedorArea ? (
            <Link
              href={whatsappAco}
              className="inline-flex items-center justify-center rounded-[18px] bg-gradient-to-r from-green-500 via-green-600 to-green-700 px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] text-white shadow-[0_14px_24px_rgba(22,163,74,0.22)] transition hover:scale-[1.02] hover:shadow-[0_22px_42px_rgba(22,163,74,0.36)] sm:px-5 sm:py-3 sm:text-xs lg:rounded-[22px] lg:px-7 lg:py-4 lg:text-base lg:tracking-[0.18em]"
            >
              Comprar aço
            </Link>
          ) : null}
        </div>
      </div>

      {!isVendedorArea ? (
        <div className="border-t border-slate-200 bg-gradient-to-r from-[#fff7f4] via-white to-[#f7fafc]">
          <div className="mx-auto flex max-w-[1600px] items-center gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8">
            <Link
              href="/produtos"
              className="whitespace-nowrap rounded-full border border-slate-300 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-700 transition hover:border-primary hover:text-primary sm:px-5 sm:text-sm sm:tracking-[0.18em]"
            >
              Catálogo
            </Link>
            <Link
              href="/produtos?categoria=ferro_aco"
              className="whitespace-nowrap rounded-full border border-green-600 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-green-700 transition hover:bg-green-50 sm:px-5 sm:text-sm sm:tracking-[0.18em]"
            >
              Catálogo aço
            </Link>
            <Link
              href="/#ofertas"
              className="whitespace-nowrap rounded-full bg-primary px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-white transition hover:bg-red-700 sm:px-5 sm:text-sm sm:tracking-[0.18em]"
            >
              Ofertas
            </Link>
            <Link
              href="/#saldao"
              className="whitespace-nowrap rounded-full border border-primary bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-primary transition hover:bg-red-50 sm:px-5 sm:text-sm sm:tracking-[0.18em]"
            >
              Saldão
            </Link>
            <Link
              href="/sorteio"
              className="whitespace-nowrap rounded-full border border-slate-300 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-700 transition hover:border-primary hover:text-primary sm:px-5 sm:text-sm sm:tracking-[0.18em]"
            >
              Sorteio
            </Link>
            <Link
              href="/vendedor"
              className="whitespace-nowrap rounded-full border border-slate-300 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-700 transition hover:border-primary hover:text-primary sm:px-5 sm:text-sm sm:tracking-[0.18em]"
            >
              Área do vendedor
            </Link>
            <div className="ml-2 hidden h-6 w-px bg-red-200 md:block" />
            <span className="hidden whitespace-nowrap text-xs font-black uppercase tracking-[0.22em] text-slate-500 md:block">
              Ofertas online com estoque real
            </span>
          </div>
        </div>
      ) : null}
    </header>
  )
}
