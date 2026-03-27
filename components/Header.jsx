'use client'
import Link from 'next/link'
import { useState } from 'react'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="bg-brand text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center font-black text-white text-lg group-hover:scale-105 transition-transform">
            G
          </div>
          <div className="leading-tight">
            <div className="font-bold text-base tracking-tight">Galpão do Aço</div>
            <div className="text-xs text-gray-400 hidden sm:block">Material de Construção</div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link href="/"        className="text-gray-300 hover:text-white transition-colors">Início</Link>
          <Link href="/produtos" className="text-gray-300 hover:text-white transition-colors">Produtos</Link>
          <Link href="#contato"  className="text-gray-300 hover:text-white transition-colors">Contato</Link>
        </nav>

        {/* CTA + Burger */}
        <div className="flex items-center gap-3">
          <Link
            href="/produtos"
            className="hidden sm:inline-flex btn-primary text-sm py-2 px-4"
          >
            Ver Catálogo
          </Link>
          <button
            className="md:hidden p-2 text-gray-300 hover:text-white"
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Menu"
          >
            {menuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-brand-light border-t border-gray-700 px-4 py-4 flex flex-col gap-3 text-sm font-medium">
          <Link href="/"         onClick={() => setMenuOpen(false)} className="text-gray-300 hover:text-white transition-colors py-1">Início</Link>
          <Link href="/produtos" onClick={() => setMenuOpen(false)} className="text-gray-300 hover:text-white transition-colors py-1">Produtos</Link>
          <Link href="#contato"  onClick={() => setMenuOpen(false)} className="text-gray-300 hover:text-white transition-colors py-1">Contato</Link>
          <Link href="/produtos" onClick={() => setMenuOpen(false)} className="btn-primary text-sm py-2 mt-1 justify-center">
            Ver Catálogo
          </Link>
        </div>
      )}
    </header>
  )
}
