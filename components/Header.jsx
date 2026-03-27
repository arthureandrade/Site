'use client'
import Link from 'next/link'
import { useState } from 'react'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="bg-brand text-white sticky top-0 z-50 shadow-lg border-b-2 border-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 bg-primary rounded flex items-center justify-center font-display text-white text-xl group-hover:scale-105 transition-transform leading-none">
            G
          </div>
          <div className="leading-tight">
            <div className="font-display text-lg tracking-wide uppercase">Galpão do Aço</div>
            <div className="text-[10px] text-gray-400 hidden sm:block uppercase tracking-widest">Material de Construção</div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold uppercase tracking-wider">
          <Link href="/"        className="text-gray-300 hover:text-white hover:text-primary transition-colors">Início</Link>
          <Link href="/produtos" className="text-gray-300 hover:text-white transition-colors">Produtos</Link>
          <a href="https://www.instagram.com/galpaodoacorr/" target="_blank" rel="noopener noreferrer"
             className="text-gray-300 hover:text-white transition-colors flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            Instagram
          </a>
          <Link href="#contato" className="text-gray-300 hover:text-white transition-colors">Contato</Link>
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
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-brand-light border-t border-gray-700 px-4 py-4 flex flex-col gap-3 text-sm font-semibold uppercase tracking-wider">
          <Link href="/"         onClick={() => setMenuOpen(false)} className="text-gray-300 hover:text-white transition-colors py-2">Início</Link>
          <Link href="/produtos" onClick={() => setMenuOpen(false)} className="text-gray-300 hover:text-white transition-colors py-2">Produtos</Link>
          <a href="https://www.instagram.com/galpaodoacorr/" target="_blank" rel="noopener noreferrer"
             onClick={() => setMenuOpen(false)} className="text-gray-300 hover:text-white transition-colors py-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            Instagram
          </a>
          <Link href="#contato"  onClick={() => setMenuOpen(false)} className="text-gray-300 hover:text-white transition-colors py-2">Contato</Link>
          <Link href="/produtos" onClick={() => setMenuOpen(false)} className="btn-primary text-sm py-2 mt-1 justify-center">
            Ver Catálogo
          </Link>
        </div>
      )}
    </header>
  )
}
