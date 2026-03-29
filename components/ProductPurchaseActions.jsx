'use client'

import { useState } from 'react'
import { useCart } from '@/context/CartContext'

export default function ProductPurchaseActions({ produto, comprarHref, comprarLabel = 'Comprar agora', fullWidth = false }) {
  const { dispatch } = useCart()
  const [adicionado, setAdicionado] = useState(false)

  function handleAdicionar() {
    dispatch({ type: 'ADD', produto })
    setAdicionado(true)
    setTimeout(() => setAdicionado(false), 1500)
  }

  return (
    <div className={`flex flex-col gap-3 sm:flex-row ${fullWidth ? 'w-full' : ''}`}>
      <a
        href={comprarHref}
        target={comprarHref.startsWith('http') ? '_blank' : undefined}
        rel={comprarHref.startsWith('http') ? 'noopener noreferrer' : undefined}
        className="flex flex-1 items-center justify-center gap-3 rounded-2xl bg-green-500 px-6 py-4 text-base font-black text-white shadow-md transition-all hover:bg-green-600 active:scale-95"
      >
        {comprarLabel}
      </a>
      <button
        type="button"
        onClick={handleAdicionar}
        className={`flex flex-1 items-center justify-center gap-3 rounded-2xl border-2 px-6 py-4 text-base font-black transition-all active:scale-95 ${
          adicionado
            ? 'border-green-200 bg-green-50 text-green-700'
            : 'border-primary text-primary hover:bg-red-50'
        }`}
      >
        {adicionado ? 'Adicionado ao carrinho' : 'Adicionar ao carrinho'}
      </button>
    </div>
  )
}
