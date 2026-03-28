'use client'

import { createContext, useContext, useReducer, useEffect } from 'react'

const CartContext = createContext(null)

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const existing = state.find(i => i.id === action.produto.id)
      if (existing) {
        return state.map(i =>
          i.id === action.produto.id ? { ...i, qty: i.qty + 1 } : i
        )
      }
      return [...state, { ...action.produto, qty: 1 }]
    }
    case 'REMOVE':
      return state.filter(i => i.id !== action.id)
    case 'INC':
      return state.map(i => i.id === action.id ? { ...i, qty: i.qty + 1 } : i)
    case 'DEC':
      return state.map(i =>
        i.id === action.id ? { ...i, qty: Math.max(1, i.qty - 1) } : i
      )
    case 'CLEAR':
      return []
    case 'INIT':
      return action.items
    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, [])

  // Carrega do localStorage na inicialização
  useEffect(() => {
    try {
      const saved = localStorage.getItem('carrinho_galpao')
      if (saved) dispatch({ type: 'INIT', items: JSON.parse(saved) })
    } catch {}
  }, [])

  // Persiste no localStorage a cada mudança
  useEffect(() => {
    try {
      localStorage.setItem('carrinho_galpao', JSON.stringify(items))
    } catch {}
  }, [items])

  const totalItens = items.reduce((acc, i) => acc + i.qty, 0)
  const totalPreco = items.reduce((acc, i) => acc + (i.preco || 0) * i.qty, 0)

  return (
    <CartContext.Provider value={{ items, dispatch, totalItens, totalPreco }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart deve ser usado dentro de CartProvider')
  return ctx
}
