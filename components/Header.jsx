'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { API_URL } from '@/lib/api'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [logoUrl, setLogoUrl] = useState('/logo.jpeg')
  const [busca, setBusca] = useState('')
  const telefone = '(95) 3224-0115'
  const whatsappAco = `https://wa.me/559532240115?text=${encodeURIComponent('Ola! Quero comprar aco e preciso de atendimento comercial.')}`

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
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-[0_10px_35px_rgba(15,23,42,0.08)] backdrop-blur-md">
      <div className="border-b border-slate-200 bg-[#f8fafc]">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-2 px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 sm:px-6 sm:py-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:px-8 lg:text-sm lg:tracking-[0.16em]">
          <div className="flex items-center justify-between gap-3">
            <a href="tel:9532240115" className="text-sm text-primary sm:text-lg">{telefone}</a>
            <span className="rounded-full bg-green-50 px-2.5 py-1 text-[9px] text-green-700 sm:px-3 sm:text-[10px] lg:inline-flex">
              Atendimento comercial rapido
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-bold tracking-[0.12em] sm:text-xs lg:text-sm">
            <span>Av. Ataide Teive, 5928</span>
            <span>Av. Ataide Teive, 4509</span>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3 sm:gap-5 sm:px-6 sm:py-4 lg:h-32 lg:px-8 lg:py-0">
        <Link href="/" className="flex items-center gap-3">
          {logoUrl ? (
            <div className="relative h-[46px] w-[180px] sm:h-[56px] sm:w-[230px] lg:h-[72px] lg:w-[320px]">
              <Image src={logoUrl} alt="Galpao do Aco" fill unoptimized className="object-contain object-left" />
            </div>
          ) : (
            <>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary font-display text-xl leading-none text-white">
                G
              </div>
              <div className="leading-tight">
                <div className="font-display text-lg uppercase tracking-wide text-gray-900">Galpao do Aco</div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-gray-400">Material de construcao</div>
              </div>
            </>
          )}
        </Link>

        <div className="hidden flex-1 px-6 md:block">
          <form onSubmit={irParaBusca} className="mx-auto flex max-w-3xl items-center gap-2 rounded-[24px] border border-slate-200 bg-white p-2 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar produtos e ir para compras..."
              className="w-full rounded-2xl border-0 bg-transparent px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:ring-0"
            />
            <button
              type="submit"
              className="rounded-2xl bg-brand px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-primary"
            >
              Buscar
            </button>
          </form>
        </div>

        <nav className="hidden items-center gap-5 text-sm font-black uppercase tracking-wide text-gray-700 md:flex">
          <Link href="/vendedor" className="transition-colors hover:text-primary">
            Area do vendedor
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href={whatsappAco}
            className="inline-flex items-center justify-center rounded-[18px] bg-gradient-to-r from-green-500 via-green-600 to-green-700 px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] text-white shadow-[0_14px_24px_rgba(22,163,74,0.22)] transition hover:scale-[1.02] hover:shadow-[0_22px_42px_rgba(22,163,74,0.36)] sm:px-5 sm:py-3 sm:text-xs lg:rounded-[22px] lg:px-7 lg:py-4 lg:text-base lg:tracking-[0.18em]"
          >
            Comprar Aco
          </Link>
          <button
            className="rounded-xl border border-gray-200 p-2.5 text-gray-700 md:hidden"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label="Menu"
          >
            {menuOpen ? (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="border-t border-slate-100 bg-white px-4 py-3 md:hidden">
        <form onSubmit={irParaBusca} className="flex items-center gap-2 rounded-[22px] border border-slate-200 bg-white p-2 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar produtos..."
            className="w-full rounded-2xl border-0 bg-transparent px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition"
          />
          <button
            type="submit"
            className="rounded-2xl bg-brand px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-primary"
          >
            Buscar
          </button>
        </form>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <Link
            href="/produtos"
            className="whitespace-nowrap rounded-full border border-slate-300 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-700"
          >
            Catalogo
          </Link>
          <Link
            href="/produtos?categoria=ferro_aco"
            className="whitespace-nowrap rounded-full border border-green-600 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-green-700"
          >
            Catalogo Aco
          </Link>
          <Link
            href="/#ofertas"
            className="whitespace-nowrap rounded-full bg-primary px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-white"
          >
            Ofertas
          </Link>
          <Link
            href="/#saldao"
            className="whitespace-nowrap rounded-full border border-primary bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-primary"
          >
            Saldao
          </Link>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-gray-100 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3 text-sm font-black uppercase tracking-wide text-gray-700">
            <Link href="/vendedor" onClick={() => setMenuOpen(false)}>
              Area do vendedor
            </Link>
          </div>
        </div>
      )}

      <div className="hidden border-t border-slate-200 bg-gradient-to-r from-[#fff7f4] via-white to-[#f7fafc] md:block">
        <div className="mx-auto flex max-w-[1600px] items-center gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/produtos"
            className="whitespace-nowrap rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-black uppercase tracking-[0.18em] text-slate-700 transition hover:border-primary hover:text-primary"
          >
            Catalogo
          </Link>
          <Link
            href="/produtos?categoria=ferro_aco"
            className="whitespace-nowrap rounded-full border border-green-600 bg-white px-5 py-2 text-sm font-black uppercase tracking-[0.18em] text-green-700 transition hover:bg-green-50"
          >
            Catalogo Aco
          </Link>
          <Link
            href="/#ofertas"
            className="whitespace-nowrap rounded-full bg-primary px-5 py-2 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-red-700"
          >
            Ofertas
          </Link>
          <Link
            href="/#saldao"
            className="whitespace-nowrap rounded-full border border-primary bg-white px-5 py-2 text-sm font-black uppercase tracking-[0.18em] text-primary transition hover:bg-red-50"
          >
            Saldao
          </Link>
          <div className="ml-2 h-6 w-px bg-red-200" />
          <span className="whitespace-nowrap text-xs font-black uppercase tracking-[0.22em] text-slate-500">
            Ofertas online com estoque real
          </span>
        </div>
      </div>
    </header>
  )
}
