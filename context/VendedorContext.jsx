'use client'

import { createContext, useContext, useReducer, useEffect } from 'react'

const VendedorContext = createContext(null)

function orcamentoReducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const qty = Math.max(1, Number(action.qty) || 1)
      const existing = state.items.find(i => i.id === action.produto.id)
      if (existing) {
        return {
          ...state,
          items: state.items.map(i =>
            i.id === action.produto.id ? { ...i, qty: i.qty + qty } : i
          ),
        }
      }
      return {
        ...state,
        items: [...state.items, { ...action.produto, qty, desconto: 0 }],
      }
    }
    case 'REMOVE':
      return { ...state, items: state.items.filter(i => i.id !== action.id) }
    case 'INC':
      return { ...state, items: state.items.map(i => i.id === action.id ? { ...i, qty: i.qty + 1 } : i) }
    case 'DEC':
      return { ...state, items: state.items.map(i => i.id === action.id ? { ...i, qty: Math.max(1, i.qty - 1) } : i) }
    case 'SET_QTY':
      return { ...state, items: state.items.map(i => i.id === action.id ? { ...i, qty: Math.max(1, Number(action.qty) || 1) } : i) }
    case 'SET_DESCONTO':
      return {
        ...state,
        items: state.items.map(i =>
          i.id === action.id
            ? { ...i, desconto: Math.min(15, Math.max(0, Number(action.desconto) || 0)) }
            : i
        ),
      }
    case 'SET_DESCONTO_GLOBAL':
      return { ...state, descontoGlobal: Math.min(15, Math.max(0, Number(action.desconto) || 0)) }
    case 'CLEAR':
      return { ...state, items: [] }
    case 'INIT':
      return { ...initialState, ...action.state }
    default:
      return state
  }
}

const initialState = { items: [], descontoGlobal: 0 }

export function VendedorProvider({ children }) {
  const [state, dispatch] = useReducer(orcamentoReducer, initialState)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('orcamento_vendedor')
      if (saved) dispatch({ type: 'INIT', state: JSON.parse(saved) })
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('orcamento_vendedor', JSON.stringify(state))
    } catch {}
  }, [state])

  const totalItens = state.items.reduce((acc, i) => acc + i.qty, 0)

  const subtotalSemDesc = state.items.reduce(
    (acc, i) => acc + (i.preco || 0) * i.qty,
    0
  )

  const totalComDesc = state.items.reduce((acc, i) => {
    const desc = Math.max(i.desconto || 0, state.descontoGlobal)
    return acc + (i.preco || 0) * i.qty * (1 - desc / 100)
  }, 0)

  const totalDesconto = subtotalSemDesc - totalComDesc

  return (
    <VendedorContext.Provider
      value={{
        ...state,
        dispatch,
        totalItens,
        subtotalSemDesc,
        totalComDesc,
        totalDesconto,
      }}
    >
      {children}
    </VendedorContext.Provider>
  )
}

export function useVendedor() {
  const ctx = useContext(VendedorContext)
  if (!ctx) throw new Error('useVendedor deve ser usado dentro de VendedorProvider')
  return ctx
}
