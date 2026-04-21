'use client'

import { createContext, useContext, useReducer, useEffect } from 'react'

const VendedorContext = createContext(null)
const DESCONTO_MAXIMO = 15
const QUANTIDADE_MINIMA = 0.5
const PASSO_QUANTIDADE = 0.5

function limitarNumero(valor, minimo, maximo) {
  return Math.min(maximo, Math.max(minimo, valor))
}

function normalizarNumeroEntrada(valor) {
  const texto = String(valor ?? '').trim()
  if (!texto) return Number.NaN

  const limpo = texto.replace(/[^\d,.-]/g, '')
  if (!limpo) return Number.NaN

  const normalizado = limpo.includes(',')
    ? limpo.replace(/\./g, '').replace(',', '.')
    : limpo

  return Number(normalizado)
}

function normalizarQuantidade(valor) {
  const numero = normalizarNumeroEntrada(valor)
  if (!Number.isFinite(numero)) return QUANTIDADE_MINIMA
  return Math.max(QUANTIDADE_MINIMA, Math.round(numero / PASSO_QUANTIDADE) * PASSO_QUANTIDADE)
}

function normalizarDesconto(valor) {
  const numero = normalizarNumeroEntrada(valor)
  if (!Number.isFinite(numero)) return 0
  return limitarNumero(numero, 0, DESCONTO_MAXIMO)
}

function normalizarItems(items) {
  if (!Array.isArray(items)) return []
  return items.map((item) => ({
    ...item,
    qty: normalizarQuantidade(item?.qty),
    desconto: normalizarDesconto(item?.desconto),
  }))
}

function orcamentoReducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const qty = normalizarQuantidade(action.qty)
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
      return { ...state, items: state.items.map(i => i.id === action.id ? { ...i, qty: normalizarQuantidade(i.qty + PASSO_QUANTIDADE) } : i) }
    case 'DEC':
      return { ...state, items: state.items.map(i => i.id === action.id ? { ...i, qty: normalizarQuantidade(Math.max(QUANTIDADE_MINIMA, i.qty - PASSO_QUANTIDADE)) } : i) }
    case 'SET_QTY':
      return { ...state, items: state.items.map(i => i.id === action.id ? { ...i, qty: normalizarQuantidade(action.qty) } : i) }
    case 'SET_DESCONTO':
      return {
        ...state,
        items: state.items.map(i =>
          i.id === action.id
            ? { ...i, desconto: normalizarDesconto(action.desconto) }
            : i
        ),
      }
    case 'SET_DESCONTO_GLOBAL':
      return { ...state, descontoGlobal: normalizarDesconto(action.desconto) }
    case 'SET_OBSERVACAO':
      return { ...state, observacao: String(action.observacao || '') }
    case 'SET_CLIENTE_NOME':
      return { ...state, clienteNome: String(action.clienteNome || '') }
    case 'CLEAR':
      return { ...state, items: [], descontoGlobal: 0, observacao: '', clienteNome: '' }
    case 'INIT':
      return {
        ...initialState,
        ...action.state,
        items: normalizarItems(action.state?.items),
        descontoGlobal: normalizarDesconto(action.state?.descontoGlobal),
      }
    case 'LOAD_ORCAMENTO':
      return {
        ...state,
        items: normalizarItems(action.orcamento?.items),
        descontoGlobal: normalizarDesconto(action.orcamento?.descontoGlobal),
        observacao: String(action.orcamento?.observacao || ''),
        clienteNome: String(action.orcamento?.clienteNome || ''),
      }
    default:
      return state
  }
}

const initialState = { items: [], descontoGlobal: 0, observacao: '', clienteNome: '' }

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
