'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { VendedorProvider, useVendedor } from '@/context/VendedorContext'
import { formatarPreco } from '@/lib/api'

const SENHA_CORRETA = 'venda123'
const LIMIT = 100

// ─────────────────────────────────────────────────────────────────────────────
// Tela de login
// ─────────────────────────────────────────────────────────────────────────────
function TelaLogin({ onLogin }) {
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  function handleSubmit(e) {
    e.preventDefault()
    if (senha === SENHA_CORRETA) {
      onLogin()
    } else {
      setErro(true)
      setSenha('')
      setTimeout(() => setErro(false), 2000)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-brand rounded-2xl p-8 shadow-2xl border border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary rounded flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-white font-display text-lg uppercase tracking-wide">Área do Vendedor</h1>
              <p className="text-gray-400 text-xs">Galpão do Aço</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Senha de acesso
              </label>
              <input
                ref={inputRef}
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="••••••••"
                className={`w-full bg-gray-900 border rounded-lg px-4 py-3 text-white text-sm
                  outline-none transition-colors
                  ${erro ? 'border-red-500 animate-pulse' : 'border-gray-700 focus:border-primary'}`}
              />
              {erro && (
                <p className="text-red-400 text-xs mt-1.5 font-medium">Senha incorreta. Tente novamente.</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary-dark active:scale-95 transition-all
                         text-white font-bold py-3 rounded-lg uppercase tracking-wide text-sm"
            >
              Entrar
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Painel de Orçamento (direita)
// ─────────────────────────────────────────────────────────────────────────────
function PainelOrcamento({ onClose }) {
  const { items, dispatch, descontoGlobal, subtotalSemDesc, totalComDesc, totalDesconto, totalItens } = useVendedor()
  const [wppDDD, setWppDDD] = useState('')
  const [wppNum, setWppNum] = useState('')

  function montarMensagem() {
    const data = new Date().toLocaleDateString('pt-BR')
    const linhas = items.map(item => {
      const desc = Math.max(item.desconto || 0, descontoGlobal)
      const precoUnit = item.preco > 0 ? formatarPreco(item.preco) : 'Consultar'
      const descStr = desc > 0 ? `${desc}%` : '-'
      const subtotal = item.preco > 0
        ? formatarPreco(item.preco * item.qty * (1 - desc / 100))
        : 'Consultar'
      return `${item.id} | ${item.nome} | ${item.qty}${item.unidade || 'UN'} | ${precoUnit} | ${descStr} | ${subtotal}`
    })

    return (
      `📋 *ORÇAMENTO - GALPÃO DO AÇO*\n` +
      `📅 Data: ${data}\n\n` +
      `*Cód.* | *Produto* | *Qtd* | *Unit.* | *Desc.* | *Subtotal*\n` +
      linhas.join('\n') +
      `\n\n💰 *Subtotal:* ${formatarPreco(subtotalSemDesc)}` +
      (totalDesconto > 0.01 ? `\n🏷️ *Desconto:* ${formatarPreco(totalDesconto)}` : '') +
      `\n✅ *Total: ${formatarPreco(totalComDesc)}*\n\n` +
      `_Orçamento válido por 24 horas. Sujeito à disponibilidade de estoque._\n` +
      `📞 Galpão do Aço | (95) 3224-0115`
    )
  }

  function enviarOrcamento() {
    if (items.length === 0) return
    const numero = wppDDD.length === 2 && wppNum.length >= 8
      ? `55${wppDDD}${wppNum}`
      : '559532240115'
    const msg = montarMensagem()
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-brand border-b border-gray-800">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
          <span className="font-bold text-white text-sm uppercase tracking-wide">Orçamento</span>
          {totalItens > 0 && (
            <span className="bg-primary text-white text-xs font-black rounded-full w-5 h-5 flex items-center justify-center">
              {totalItens > 99 ? '99+' : totalItens}
            </span>
          )}
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 lg:hidden">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        )}
      </div>

      {/* Lista de itens */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500 text-sm gap-2">
            <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <p>Nenhum item adicionado</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map(item => {
              const descEfetiva = Math.max(item.desconto || 0, descontoGlobal)
              const precoComDesc = item.preco * (1 - descEfetiva / 100)
              return (
                <div key={item.id} className="px-3 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-gray-400 font-mono">Cód. {item.id}</p>
                      <p className="text-xs font-semibold text-gray-800 leading-snug line-clamp-2">
                        {item.nome}
                      </p>
                    </div>
                    <button
                      onClick={() => dispatch({ type: 'REMOVE', id: item.id })}
                      className="text-gray-300 hover:text-red-500 transition-colors shrink-0 mt-0.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mt-1.5">
                    {/* Qty */}
                    <div className="flex items-center gap-1">
                      <button onClick={() => dispatch({ type: 'DEC', id: item.id })}
                        className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:border-primary hover:text-primary transition-colors font-bold text-sm leading-none">
                        −
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={e => dispatch({ type: 'SET_QTY', id: item.id, qty: e.target.value })}
                        className="w-10 text-center text-xs font-bold border border-gray-300 rounded py-0.5 outline-none focus:border-primary"
                      />
                      <button onClick={() => dispatch({ type: 'INC', id: item.id })}
                        className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:border-primary hover:text-primary transition-colors font-bold text-sm leading-none">
                        +
                      </button>
                    </div>

                    {/* Desconto por item */}
                    <div className="flex items-center gap-1 ml-auto">
                      <span className="text-[10px] text-gray-400">Desc.</span>
                      <input
                        type="number"
                        min="0"
                        max="15"
                        value={item.desconto || 0}
                        onChange={e => dispatch({ type: 'SET_DESCONTO', id: item.id, desconto: e.target.value })}
                        className="w-10 text-center text-xs border border-gray-300 rounded py-0.5 outline-none focus:border-primary"
                      />
                      <span className="text-[10px] text-gray-400">%</span>
                    </div>
                  </div>

                  {/* Preços */}
                  {item.preco > 0 && (
                    <div className="flex items-center justify-end gap-2 mt-1">
                      {descEfetiva > 0 && (
                        <span className="text-[10px] text-gray-400 line-through">
                          {formatarPreco(item.preco * item.qty)}
                        </span>
                      )}
                      <span className="text-xs font-black text-primary">
                        {formatarPreco(precoComDesc * item.qty)}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {items.length > 0 && (
        <div className="border-t border-gray-200 bg-white">
          {/* Desconto global */}
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Desconto geral
              </label>
              <span className="text-xs font-black text-primary">{descontoGlobal}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="15"
              step="1"
              value={descontoGlobal}
              onChange={e => dispatch({ type: 'SET_DESCONTO_GLOBAL', desconto: e.target.value })}
              className="w-full accent-[#CC0000] h-1.5"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
              <span>0%</span><span>5%</span><span>10%</span><span>15%</span>
            </div>
          </div>

          {/* Totais */}
          <div className="px-4 py-2 space-y-1 border-t border-gray-100">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Subtotal</span>
              <span>{formatarPreco(subtotalSemDesc)}</span>
            </div>
            {totalDesconto > 0.01 && (
              <div className="flex justify-between text-xs text-green-600 font-semibold">
                <span>Desconto</span>
                <span>− {formatarPreco(totalDesconto)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-gray-900">
              <span className="text-sm">Total</span>
              <span className="text-base">{formatarPreco(totalComDesc)}</span>
            </div>
          </div>

          {/* Número WhatsApp destino */}
          <div className="px-4 py-2 border-t border-gray-100">
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Enviar para (WhatsApp)
            </label>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1.5 rounded border border-gray-200">
                +55
              </span>
              <input
                type="tel"
                maxLength={2}
                placeholder="DDD"
                value={wppDDD}
                onChange={e => setWppDDD(e.target.value.replace(/\D/g, '').slice(0, 2))}
                className="w-12 text-center text-xs border border-gray-300 rounded py-1.5 outline-none focus:border-primary"
              />
              <input
                type="tel"
                maxLength={9}
                placeholder="Número"
                value={wppNum}
                onChange={e => setWppNum(e.target.value.replace(/\D/g, '').slice(0, 9))}
                className="flex-1 text-center text-xs border border-gray-300 rounded py-1.5 outline-none focus:border-primary"
              />
            </div>
            {(!wppDDD || !wppNum) && (
              <p className="text-[10px] text-gray-400 mt-1">
                Deixe vazio para enviar ao número padrão da loja
              </p>
            )}
          </div>

          {/* Botões */}
          <div className="px-4 pb-4 pt-1 space-y-2">
            <button
              onClick={enviarOrcamento}
              className="w-full bg-[#25D366] hover:bg-[#1ebe5a] active:scale-95 transition-all
                         text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Enviar Orçamento
            </button>
            <button
              onClick={() => dispatch({ type: 'CLEAR' })}
              className="w-full text-xs text-gray-400 hover:text-red-500 transition-colors py-1"
            >
              Limpar orçamento
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Catálogo em tabela
// ─────────────────────────────────────────────────────────────────────────────
function CatalogoCatalogo() {
  const { dispatch } = useVendedor()
  const [produtos, setProdutos] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [secaoFiltro, setSecaoFiltro] = useState('')
  const [page, setPage] = useState(0)
  const [secoes, setSecoes] = useState([])
  const [qtdMap, setQtdMap] = useState({})
  const [adicionados, setAdicionados] = useState({})

  const apiUrl =
    (typeof window !== 'undefined' && window.__ENV_API_URL__) ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:8000'

  const fetchProdutos = useCallback(async (p = 0, busca_ = '', secao_ = '') => {
    setLoading(true)
    const qs = new URLSearchParams({ skip: p * LIMIT, limit: LIMIT, todas_secoes: '1' })
    if (busca_) qs.set('busca', busca_)
    if (secao_) qs.set('secao', secao_)
    try {
      const res = await fetch(`${apiUrl}/produtos?${qs}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      const lista = data.produtos || []
      setProdutos(lista)
      setTotal(data.total || 0)
      // Popula seções únicas da primeira página sem filtro
      if (p === 0 && !secao_) {
        setSecoes(prev => {
          const unique = [...new Set([...prev, ...lista.map(p => p.secao).filter(Boolean)])]
          return unique.sort((a, b) => a - b)
        })
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [apiUrl])

  useEffect(() => { fetchProdutos(0, '', '') }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(0)
      fetchProdutos(0, busca, secaoFiltro)
    }, 400)
    return () => clearTimeout(t)
  }, [busca, secaoFiltro])

  function handlePage(nova) {
    setPage(nova)
    fetchProdutos(nova, busca, secaoFiltro)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function getQtd(id) {
    return qtdMap[id] ?? 1
  }

  function handleAdicionar(produto) {
    const qty = getQtd(produto.id)
    dispatch({ type: 'ADD', produto, qty })
    setAdicionados(prev => ({ ...prev, [produto.id]: true }))
    setTimeout(() => setAdicionados(prev => ({ ...prev, [produto.id]: false })), 1500)
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="flex flex-col h-full">
      {/* Filtros */}
      <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex flex-wrap items-center gap-2 sticky top-0 z-10">
        {/* Busca */}
        <div className="relative flex-1 min-w-[180px]">
          <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar por código ou descrição..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-primary"
          />
        </div>

        {/* Seção */}
        <select
          value={secaoFiltro}
          onChange={e => { setSecaoFiltro(e.target.value); setPage(0) }}
          className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 outline-none focus:border-primary bg-white min-w-[130px]"
        >
          <option value="">Todas as seções</option>
          {secoes.map(s => (
            <option key={s} value={s}>Seção {s}</option>
          ))}
        </select>

        <span className="text-xs text-gray-400 ml-auto hidden sm:block font-semibold">
          {total.toLocaleString('pt-BR')} produto{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tabela */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <svg className="w-8 h-8 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          </div>
        ) : (
          <table className="w-full text-xs border-collapse">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr className="text-left text-gray-500 uppercase tracking-wide font-bold text-[10px]">
                <th className="px-3 py-2 border-b border-gray-200 w-20">Código</th>
                <th className="px-3 py-2 border-b border-gray-200">Descrição</th>
                <th className="px-3 py-2 border-b border-gray-200 w-12 text-center hidden sm:table-cell">Und</th>
                <th className="px-3 py-2 border-b border-gray-200 w-20 text-right hidden md:table-cell">Estoque</th>
                <th className="px-3 py-2 border-b border-gray-200 w-24 text-right">Preço</th>
                <th className="px-3 py-2 border-b border-gray-200 w-20 text-center">Qtd</th>
                <th className="px-3 py-2 border-b border-gray-200 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {produtos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    Nenhum produto encontrado
                  </td>
                </tr>
              ) : produtos.map(prod => (
                <tr key={prod.id}
                  className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2 font-mono text-gray-400 text-[10px]">{prod.id}</td>
                  <td className="px-3 py-2 font-medium text-gray-800 max-w-[260px]">
                    <span className="line-clamp-2 leading-snug">{prod.nome}</span>
                  </td>
                  <td className="px-3 py-2 text-center text-gray-500 hidden sm:table-cell">
                    {prod.unidade || 'UN'}
                  </td>
                  <td className={`px-3 py-2 text-right font-semibold hidden md:table-cell
                    ${prod.estoque > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                    {prod.estoque > 0 ? prod.estoque.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : '—'}
                  </td>
                  <td className="px-3 py-2 text-right font-black text-gray-900">
                    {prod.preco > 0 ? formatarPreco(prod.preco) : <span className="text-gray-400 font-normal">—</span>}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="number"
                      min="1"
                      value={getQtd(prod.id)}
                      onChange={e => setQtdMap(prev => ({ ...prev, [prod.id]: Math.max(1, Number(e.target.value) || 1) }))}
                      className="w-14 text-center text-xs border border-gray-300 rounded py-1 outline-none focus:border-primary"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => handleAdicionar(prod)}
                      title="Adicionar ao orçamento"
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm
                        transition-all active:scale-90
                        ${adicionados[prod.id]
                          ? 'bg-green-500 text-white'
                          : 'bg-primary hover:bg-primary-dark text-white'}`}
                    >
                      {adicionados[prod.id] ? '✓' : '+'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 py-3 border-t border-gray-200 bg-white flex-wrap px-4">
          <button
            disabled={page === 0}
            onClick={() => handlePage(page - 1)}
            className="px-3 py-1.5 rounded border border-gray-300 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
          >
            ← Ant.
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            const pg = totalPages <= 7 ? i
              : page < 4 ? i
              : page > totalPages - 5 ? totalPages - 7 + i
              : page - 3 + i
            return (
              <button
                key={pg}
                onClick={() => handlePage(pg)}
                className={`w-8 h-8 rounded text-xs font-black transition-all ${
                  pg === page
                    ? 'bg-primary text-white'
                    : 'border border-gray-300 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {pg + 1}
              </button>
            )
          })}
          <button
            disabled={page >= totalPages - 1}
            onClick={() => handlePage(page + 1)}
            className="px-3 py-1.5 rounded border border-gray-300 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
          >
            Próx. →
          </button>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// View principal
// ─────────────────────────────────────────────────────────────────────────────
function VendedorContent() {
  const [autenticado, setAutenticado] = useState(false)
  const [tab, setTab] = useState('catalogo') // 'catalogo' | 'orcamento'
  const { totalItens } = useVendedor()

  if (!autenticado) {
    return <TelaLogin onLogin={() => setAutenticado(true)} />
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Cabeçalho interno */}
      <div className="bg-brand border-b-2 border-primary text-white py-3 px-4 flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-1 w-6 bg-primary rounded" />
            <h1 className="font-display text-lg uppercase tracking-wide">Área do Vendedor</h1>
          </div>
          <p className="text-gray-400 text-xs mt-0.5 ml-8">
            Catálogo completo com preços e estoque em tempo real
          </p>
        </div>
        <button
          onClick={() => setAutenticado(false)}
          className="text-gray-500 hover:text-white transition-colors text-xs flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
          Sair
        </button>
      </div>

      {/* Tabs mobile */}
      <div className="lg:hidden flex border-b border-gray-200 bg-white shrink-0">
        <button
          onClick={() => setTab('catalogo')}
          className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors
            ${tab === 'catalogo' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Catálogo
        </button>
        <button
          onClick={() => setTab('orcamento')}
          className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors relative
            ${tab === 'orcamento' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Orçamento
          {totalItens > 0 && (
            <span className="absolute top-1.5 right-6 bg-primary text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">
              {totalItens > 9 ? '9+' : totalItens}
            </span>
          )}
        </button>
      </div>

      {/* Layout desktop: split — mobile: tab */}
      <div className="flex flex-1 overflow-hidden">
        {/* Catálogo */}
        <div className={`flex-1 overflow-hidden flex flex-col
          ${tab === 'orcamento' ? 'hidden lg:flex' : 'flex'}`}>
          <CatalogoCatalogo />
        </div>

        {/* Orçamento */}
        <div className={`w-full lg:w-80 xl:w-96 border-l border-gray-200 bg-white overflow-hidden flex flex-col shrink-0
          ${tab === 'catalogo' ? 'hidden lg:flex' : 'flex'}`}>
          <PainelOrcamento onClose={() => setTab('catalogo')} />
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Export com Provider
// ─────────────────────────────────────────────────────────────────────────────
export default function VendedorView() {
  return (
    <VendedorProvider>
      <VendedorContent />
    </VendedorProvider>
  )
}
