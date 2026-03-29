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
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 bg-[#fafafa]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-gray-500 sm:px-6">
          <a href="tel:9532240115" className="text-primary">{telefone}</a>
          <span className="hidden sm:inline">Av. Ataide Teive, 5928</span>
          <span className="hidden lg:inline">Av. Ataide Teive, 4509</span>
        </div>
      </div>

      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          {logoUrl ? (
            <div className="relative h-11 w-[170px]">
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

        <div className="hidden flex-1 px-8 md:block">
          <form onSubmit={irParaBusca} className="mx-auto flex max-w-xl items-center gap-2">
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar produtos e ir para compras..."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 outline-none transition focus:border-primary"
            />
            <button
              type="submit"
              className="rounded-xl bg-primary px-4 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:bg-red-700"
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
          <a href="tel:9532240115" className="hidden rounded-xl border border-primary px-4 py-3 text-sm font-black uppercase tracking-wide text-primary transition hover:bg-red-50 lg:inline-flex">
            {telefone}
          </a>
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

      {menuOpen && (
        <div className="border-t border-gray-100 bg-white px-4 py-4 md:hidden">
          <form onSubmit={irParaBusca} className="mb-4 flex items-center gap-2">
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar produtos..."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 outline-none transition focus:border-primary"
            />
            <button
              type="submit"
              className="rounded-xl bg-primary px-4 py-3 text-xs font-black uppercase tracking-wide text-white transition hover:bg-red-700"
            >
              Buscar
            </button>
          </form>
          <div className="flex flex-col gap-3 text-sm font-black uppercase tracking-wide text-gray-700">
            <Link href="/vendedor" onClick={() => setMenuOpen(false)}>
              Area do vendedor
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
