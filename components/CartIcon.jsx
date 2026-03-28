'use client'

import { useState } from 'react'
import { useCart } from '@/context/CartContext'
import CartDrawer from './CartDrawer'

export default function CartIcon() {
  const { totalItens } = useCart()
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-30 bg-[#CC0000] hover:bg-[#aa0000] active:scale-95
                   transition-all duration-200 text-white rounded-full w-14 h-14 shadow-lg
                   flex items-center justify-center"
        aria-label="Abrir carrinho"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
        </svg>

        {/* Badge de quantidade */}
        {totalItens > 0 && (
          <span className="absolute -top-1 -right-1 bg-black text-white text-xs font-black
                           rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
            {totalItens > 99 ? '99+' : totalItens}
          </span>
        )}
      </button>

      <CartDrawer open={open} onClose={() => setOpen(false)} />
    </>
  )
}
