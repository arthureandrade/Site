'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { API_URL } from '@/lib/api'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [logoUrl, setLogoUrl] = useState(null)

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
          <span>Compra em 10x sem juros</span>
          <span className="hidden sm:inline">Entrega rapida em Boa Vista</span>
          <span>Estoque real do ERP</span>
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

        <nav className="hidden items-center gap-8 text-sm font-black uppercase tracking-wide text-gray-700 md:flex">
          <Link href="/" className="transition-colors hover:text-primary">
            Inicio
          </Link>
          <Link href="/produtos" className="transition-colors hover:text-primary">
            Produtos
          </Link>
          <Link href="/produtos?busca=ferro" className="transition-colors hover:text-primary">
            Ferro e aco
          </Link>
          <Link href="/produtos?busca=tubo" className="transition-colors hover:text-primary">
            Tubos
          </Link>
          <Link href="/produtos?busca=ferragem" className="transition-colors hover:text-primary">
            Ferragens
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/produtos" className="hidden rounded-xl bg-primary px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:bg-red-700 sm:inline-flex">
            Comprar agora
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

      {menuOpen && (
        <div className="border-t border-gray-100 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3 text-sm font-black uppercase tracking-wide text-gray-700">
            <Link href="/" onClick={() => setMenuOpen(false)}>
              Inicio
            </Link>
            <Link href="/produtos" onClick={() => setMenuOpen(false)}>
              Produtos
            </Link>
            <Link href="/produtos?busca=ferro" onClick={() => setMenuOpen(false)}>
              Ferro e aco
            </Link>
            <Link href="/produtos?busca=tubo" onClick={() => setMenuOpen(false)}>
              Tubos
            </Link>
            <Link href="/produtos?busca=ferragem" onClick={() => setMenuOpen(false)}>
              Ferragens
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
