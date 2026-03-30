'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { VendedorProvider, useVendedor } from '@/context/VendedorContext'
import { formatarPreco } from '@/lib/api'
import { deveExibirNoVendedor, numeroSecao } from '@/lib/catalogo'

const SENHA_CORRETA = 'venda123'
const LIMIT = 100

function TelaLogin({ onLogin }) {
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    if (senha === SENHA_CORRETA) {
      onLogin()
      return
    }
    setErro(true)
    setSenha('')
    setTimeout(() => setErro(false), 2000)
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-800 bg-brand p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded bg-primary">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h1 className="font-display text-lg uppercase tracking-wide text-white">Area do vendedor</h1>
            <p className="text-xs text-gray-400">Galpao do Aco</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
              Senha de acesso
            </label>
            <input
              ref={inputRef}
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite a senha"
              className={`w-full rounded-lg border bg-gray-900 px-4 py-3 text-sm text-white outline-none transition-colors ${
                erro ? 'border-red-500' : 'border-gray-700 focus:border-primary'
              }`}
            />
            {erro && <p className="mt-1.5 text-xs font-medium text-red-400">Senha incorreta. Tente novamente.</p>}
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-primary py-3 text-sm font-bold uppercase tracking-wide text-white transition-all hover:bg-red-700 active:scale-95"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  )
}

function PainelOrcamento({ onClose }) {
  const { items, dispatch, descontoGlobal, subtotalSemDesc, totalComDesc, totalDesconto, totalItens } = useVendedor()
  const [wppDDD, setWppDDD] = useState('')
  const [wppNum, setWppNum] = useState('')

  function montarMensagem() {
    const data = new Date().toLocaleDateString('pt-BR')
    const linhas = items.map((item) => {
      const desc = Math.max(item.desconto || 0, descontoGlobal)
      const precoUnit = item.preco > 0 ? formatarPreco(item.preco) : 'Consultar'
      const subtotal = item.preco > 0 ? formatarPreco(item.preco * item.qty * (1 - desc / 100)) : 'Consultar'
      return `${item.id} | ${item.nome} | ${item.qty}${item.unidade || 'UN'} | ${precoUnit} | ${desc > 0 ? `${desc}%` : '-'} | ${subtotal}`
    })

    return (
      `*ORCAMENTO - GALPAO DO ACO*\n` +
      `Data: ${data}\n\n` +
      `*Cod.* | *Produto* | *Qtd* | *Unit.* | *Desc.* | *Subtotal*\n` +
      linhas.join('\n') +
      `\n\n*Subtotal:* ${formatarPreco(subtotalSemDesc)}` +
      (totalDesconto > 0.01 ? `\n*Desconto:* ${formatarPreco(totalDesconto)}` : '') +
      `\n*Total:* ${formatarPreco(totalComDesc)}\n\n` +
      `_Orcamento valido por 24 horas. Sujeito a disponibilidade de estoque._\n` +
      `Galpao do Aco | (95) 3224-0115`
    )
  }

  function enviarOrcamento() {
    if (items.length === 0) return
    const numero = wppDDD.length === 2 && wppNum.length >= 8 ? `55${wppDDD}${wppNum}` : '559532240115'
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(montarMensagem())}`, '_blank')
  }

  function gerarPdf() {
    if (items.length === 0) return

    const data = new Date().toLocaleDateString('pt-BR')
    const linhas = items.map((item) => {
      const desc = Math.max(item.desconto || 0, descontoGlobal)
      const precoUnit = item.preco > 0 ? formatarPreco(item.preco) : 'Consultar'
      const subtotal = item.preco > 0 ? formatarPreco(item.preco * item.qty * (1 - desc / 100)) : 'Consultar'
      return `
        <tr>
          <td>${item.id}</td>
          <td>${item.nome}</td>
          <td>${item.qty}${item.unidade || 'UN'}</td>
          <td>${precoUnit}</td>
          <td>${desc > 0 ? `${desc}%` : '-'}</td>
          <td>${subtotal}</td>
        </tr>
      `
    }).join('')

    const html = `
      <!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>Orcamento Galpao do Aco</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #111827; }
            .topo { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
            .marca { font-size: 28px; font-weight: 800; color: #7f1d1d; text-transform: uppercase; }
            .sub { color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: .12em; }
            .bloco { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; vertical-align: top; }
            th { background: #f9fafb; text-transform: uppercase; font-size: 11px; letter-spacing: .08em; }
            .totais { margin-top: 18px; margin-left: auto; width: 320px; }
            .totais div { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e5e7eb; }
            .totais div.total { font-weight: 800; font-size: 16px; color: #111827; }
            .rodape { margin-top: 28px; color: #6b7280; font-size: 12px; }
            @media print {
              body { padding: 16px; }
            }
          </style>
        </head>
        <body>
          <div class="topo">
            <div>
              <div class="marca">Galpao do Aco</div>
              <div class="sub">Orcamento comercial</div>
            </div>
            <div class="sub">Data: ${data}</div>
          </div>

          <div class="bloco">
            <table>
              <thead>
                <tr>
                  <th>Cod.</th>
                  <th>Produto</th>
                  <th>Qtd</th>
                  <th>Unit.</th>
                  <th>Desc.</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${linhas}
              </tbody>
            </table>
          </div>

          <div class="totais">
            <div><span>Subtotal</span><strong>${formatarPreco(subtotalSemDesc)}</strong></div>
            ${totalDesconto > 0.01 ? `<div><span>Desconto</span><strong>- ${formatarPreco(totalDesconto)}</strong></div>` : ''}
            <div class="total"><span>Total</span><strong>${formatarPreco(totalComDesc)}</strong></div>
          </div>

          <div class="rodape">
            Orcamento valido por 24 horas. Sujeito a disponibilidade de estoque.<br />
            Galpao do Aco | (95) 3224-0115
          </div>
        </body>
      </html>
    `

    const popup = window.open('', '_blank', 'width=980,height=720')
    if (!popup) return
    popup.document.open()
    popup.document.write(html)
    popup.document.close()
    popup.focus()
    setTimeout(() => {
      popup.print()
    }, 300)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-800 bg-brand px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold uppercase tracking-wide text-white">Orcamento</span>
          {totalItens > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-black text-white">
              {totalItens > 99 ? '99+' : totalItens}
            </span>
          )}
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 text-gray-400 transition-colors hover:text-white lg:hidden">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-sm text-gray-500">
            <p>Nenhum item adicionado</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((item) => {
              const descEfetiva = Math.max(item.desconto || 0, descontoGlobal)
              const precoComDesc = item.preco * (1 - descEfetiva / 100)
              return (
                <div key={item.id} className="px-3 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[10px] text-gray-400">Cod. {item.id}</p>
                      <p className="line-clamp-2 text-xs font-semibold leading-snug text-gray-800">{item.nome}</p>
                    </div>
                    <button onClick={() => dispatch({ type: 'REMOVE', id: item.id })} className="shrink-0 text-gray-300 transition-colors hover:text-red-500">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <button onClick={() => dispatch({ type: 'DEC', id: item.id })} className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 text-sm font-bold text-gray-600 transition-colors hover:border-primary hover:text-primary">
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => dispatch({ type: 'SET_QTY', id: item.id, qty: e.target.value })}
                        className="w-10 rounded border border-gray-300 py-0.5 text-center text-xs font-bold outline-none focus:border-primary"
                      />
                      <button onClick={() => dispatch({ type: 'INC', id: item.id })} className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 text-sm font-bold text-gray-600 transition-colors hover:border-primary hover:text-primary">
                        +
                      </button>
                    </div>

                    <div className="ml-auto flex items-center gap-1">
                      <span className="text-[10px] text-gray-400">Desc.</span>
                      <input
                        type="number"
                        min="0"
                        max="15"
                        value={item.desconto || 0}
                        onChange={(e) => dispatch({ type: 'SET_DESCONTO', id: item.id, desconto: e.target.value })}
                        className="w-10 rounded border border-gray-300 py-0.5 text-center text-xs outline-none focus:border-primary"
                      />
                      <span className="text-[10px] text-gray-400">%</span>
                    </div>
                  </div>

                  {item.preco > 0 && (
                    <div className="mt-1 flex items-center justify-end gap-2">
                      {descEfetiva > 0 && <span className="text-[10px] text-gray-400 line-through">{formatarPreco(item.preco * item.qty)}</span>}
                      <span className="text-xs font-black text-primary">{formatarPreco(precoComDesc * item.qty)}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="border-t border-gray-200 bg-white">
          <div className="px-4 pb-2 pt-3">
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Desconto geral</label>
              <span className="text-xs font-black text-primary">{descontoGlobal}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="15"
              step="1"
              value={descontoGlobal}
              onChange={(e) => dispatch({ type: 'SET_DESCONTO_GLOBAL', desconto: e.target.value })}
              className="h-1.5 w-full accent-[#CC0000]"
            />
          </div>

          <div className="space-y-1 border-t border-gray-100 px-4 py-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Subtotal</span>
              <span>{formatarPreco(subtotalSemDesc)}</span>
            </div>
            {totalDesconto > 0.01 && (
              <div className="flex justify-between text-xs font-semibold text-green-600">
                <span>Desconto</span>
                <span>- {formatarPreco(totalDesconto)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-gray-900">
              <span className="text-sm">Total</span>
              <span className="text-base">{formatarPreco(totalComDesc)}</span>
            </div>
          </div>

          <div className="border-t border-gray-100 px-4 py-2">
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              Enviar para (WhatsApp)
            </label>
            <div className="flex items-center gap-1.5">
              <span className="rounded border border-gray-200 bg-gray-100 px-2 py-1.5 text-xs font-bold text-gray-400">+55</span>
              <input
                type="tel"
                maxLength={2}
                placeholder="DDD"
                value={wppDDD}
                onChange={(e) => setWppDDD(e.target.value.replace(/\D/g, '').slice(0, 2))}
                className="w-12 rounded border border-gray-300 py-1.5 text-center text-xs outline-none focus:border-primary"
              />
              <input
                type="tel"
                maxLength={9}
                placeholder="Numero"
                value={wppNum}
                onChange={(e) => setWppNum(e.target.value.replace(/\D/g, '').slice(0, 9))}
                className="flex-1 rounded border border-gray-300 py-1.5 text-center text-xs outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-2 px-4 pb-4 pt-1">
            <button onClick={enviarOrcamento} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 font-bold text-white transition-all hover:bg-[#1ebe5a] active:scale-95">
              Enviar orcamento
            </button>
            <button onClick={gerarPdf} className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary bg-white py-3 font-bold text-primary transition-all hover:bg-red-50 active:scale-95">
              Gerar PDF
            </button>
            <button onClick={() => dispatch({ type: 'CLEAR' })} className="w-full py-1 text-xs text-gray-400 transition-colors hover:text-red-500">
              Limpar orcamento
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function CatalogoCatalogo() {
  const { dispatch } = useVendedor()
  const [produtos, setProdutos] = useState([])
  const [base, setBase] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [secaoFiltro, setSecaoFiltro] = useState('')
  const [page, setPage] = useState(0)
  const [secoes, setSecoes] = useState([])
  const [qtdMap, setQtdMap] = useState({})
  const [adicionados, setAdicionados] = useState({})

  const apiUrl = (typeof window !== 'undefined' && window.__ENV_API_URL__) || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  const aplicarFiltros = useCallback((catalogo, p = 0, buscaAtual = '', secaoAtual = '') => {
    const termo = String(buscaAtual || '').toLowerCase().trim()
    const filtrados = catalogo.filter((produto) => {
      const nome = String(produto.nome || '').toLowerCase()
      const codigo = String(produto.id || '').toLowerCase()
      const casaBusca = !termo || nome.includes(termo) || codigo.includes(termo)
      const casaSecao = !secaoAtual || String(numeroSecao(produto.secao)) === String(secaoAtual)
      return casaBusca && casaSecao
    })

    setTotal(filtrados.length)
    setProdutos(filtrados.slice(p * LIMIT, p * LIMIT + LIMIT))
  }, [])

  const fetchProdutos = useCallback(async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams({ skip: 0, limit: 5000, todas_secoes: '1' })
      const res = await fetch(`${apiUrl}/produtos?${qs}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      const catalogo = (data.produtos || []).filter(deveExibirNoVendedor)
      setBase(catalogo)
      setSecoes([...new Set(catalogo.map((item) => numeroSecao(item.secao)).filter((secao) => secao != null))].sort((a, b) => a - b))
      aplicarFiltros(catalogo, 0, '', '')
    } finally {
      setLoading(false)
    }
  }, [apiUrl, aplicarFiltros])

  useEffect(() => {
    fetchProdutos()
  }, [fetchProdutos])

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0)
      aplicarFiltros(base, 0, busca, secaoFiltro)
    }, 300)
    return () => clearTimeout(timer)
  }, [base, busca, secaoFiltro, aplicarFiltros])

  function handlePage(nova) {
    setPage(nova)
    aplicarFiltros(base, nova, busca, secaoFiltro)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function getQtd(id) {
    return qtdMap[id] ?? 1
  }

  function handleAdicionar(produto) {
    const qty = getQtd(produto.id)
    dispatch({ type: 'ADD', produto, qty })
    setAdicionados((prev) => ({ ...prev, [produto.id]: true }))
    setTimeout(() => setAdicionados((prev) => ({ ...prev, [produto.id]: false })), 1500)
  }

  const totalPages = useMemo(() => Math.ceil(total / LIMIT), [total])

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-4 py-2.5">
        <div className="relative min-w-[180px] flex-1">
          <svg className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por codigo ou descricao..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-primary"
          />
        </div>

        <select
          value={secaoFiltro}
          onChange={(e) => {
            setSecaoFiltro(e.target.value)
            setPage(0)
          }}
          className="min-w-[130px] rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-primary"
        >
          <option value="">Todas as secoes</option>
          {secoes.map((secao) => (
            <option key={secao} value={secao}>
              Secao {secao}
            </option>
          ))}
        </select>

        <span className="ml-auto hidden text-xs font-semibold text-gray-400 sm:block">
          {total.toLocaleString('pt-BR')} produto{total !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <svg className="h-8 w-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        ) : (
          <table className="w-full border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-gray-50">
              <tr className="text-left text-[10px] font-bold uppercase tracking-wide text-gray-500">
                <th className="w-20 border-b border-gray-200 px-3 py-2">Codigo</th>
                <th className="border-b border-gray-200 px-3 py-2">Descricao</th>
                <th className="hidden w-12 border-b border-gray-200 px-3 py-2 text-center sm:table-cell">Und</th>
                <th className="hidden w-20 border-b border-gray-200 px-3 py-2 text-right md:table-cell">Estoque</th>
                <th className="w-24 border-b border-gray-200 px-3 py-2 text-right">Preco</th>
                <th className="w-20 border-b border-gray-200 px-3 py-2 text-center">Qtd</th>
                <th className="w-10 border-b border-gray-200 px-3 py-2 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {produtos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    Nenhum produto encontrado
                  </td>
                </tr>
              ) : (
                produtos.map((prod) => (
                  <tr key={prod.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono text-[10px] text-gray-400">{prod.id}</td>
                    <td className="max-w-[260px] px-3 py-2 font-medium text-gray-800">
                      <span className="line-clamp-2 leading-snug">{prod.nome}</span>
                    </td>
                    <td className="hidden px-3 py-2 text-center text-gray-500 sm:table-cell">{prod.unidade || 'UN'}</td>
                    <td className={`hidden px-3 py-2 text-right font-semibold md:table-cell ${prod.estoque > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                      {prod.estoque > 0 ? prod.estoque.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="px-3 py-2 text-right font-black text-gray-900">{formatarPreco(prod.preco)}</td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number"
                        min="1"
                        value={getQtd(prod.id)}
                        onChange={(e) => setQtdMap((prev) => ({ ...prev, [prod.id]: Math.max(1, Number(e.target.value) || 1) }))}
                        className="w-14 rounded border border-gray-300 py-1 text-center text-xs outline-none focus:border-primary"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => handleAdicionar(prod)}
                        title="Adicionar ao orcamento"
                        className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold text-white transition-all active:scale-90 ${
                          adicionados[prod.id] ? 'bg-green-500' : 'bg-primary hover:bg-red-700'
                        }`}
                      >
                        {adicionados[prod.id] ? '✓' : '+'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 border-t border-gray-200 bg-white px-4 py-3">
          <button
            disabled={page === 0}
            onClick={() => handlePage(page - 1)}
            className="rounded border border-gray-300 px-3 py-1.5 text-xs font-bold transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Ant.
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            const pg = totalPages <= 7 ? i : page < 4 ? i : page > totalPages - 5 ? totalPages - 7 + i : page - 3 + i
            return (
              <button
                key={pg}
                onClick={() => handlePage(pg)}
                className={`h-8 w-8 rounded text-xs font-black transition-all ${
                  pg === page ? 'bg-primary text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {pg + 1}
              </button>
            )
          })}
          <button
            disabled={page >= totalPages - 1}
            onClick={() => handlePage(page + 1)}
            className="rounded border border-gray-300 px-3 py-1.5 text-xs font-bold transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Prox. →
          </button>
        </div>
      )}
    </div>
  )
}

function VendedorContent() {
  const [autenticado, setAutenticado] = useState(false)
  const [tab, setTab] = useState('catalogo')
  const { totalItens } = useVendedor()

  if (!autenticado) {
    return <TelaLogin onLogin={() => setAutenticado(true)} />
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      <div className="flex shrink-0 items-center justify-between border-b-2 border-primary bg-brand px-4 py-3 text-white">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-1 w-6 rounded bg-primary" />
            <h1 className="font-display text-lg uppercase tracking-wide">Area do vendedor</h1>
          </div>
          <p className="ml-8 mt-0.5 text-xs text-gray-400">Catalogo comercial sem produtos sem preco e sem secao 4</p>
        </div>
        <button onClick={() => setAutenticado(false)} className="flex items-center gap-1 text-xs text-gray-500 transition-colors hover:text-white">
          Sair
        </button>
      </div>

      <div className="flex shrink-0 border-b border-gray-200 bg-white lg:hidden">
        <button
          onClick={() => setTab('catalogo')}
          className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors ${tab === 'catalogo' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Catalogo
        </button>
        <button
          onClick={() => setTab('orcamento')}
          className={`relative flex-1 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors ${tab === 'orcamento' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Orcamento
          {totalItens > 0 && <span className="absolute right-6 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-black text-white">{totalItens > 9 ? '9+' : totalItens}</span>}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className={`flex flex-1 flex-col overflow-hidden ${tab === 'orcamento' ? 'hidden lg:flex' : 'flex'}`}>
          <CatalogoCatalogo />
        </div>

        <div className={`flex w-full shrink-0 flex-col overflow-hidden border-l border-gray-200 bg-white lg:w-80 xl:w-96 ${tab === 'catalogo' ? 'hidden lg:flex' : 'flex'}`}>
          <PainelOrcamento onClose={() => setTab('catalogo')} />
        </div>
      </div>
    </div>
  )
}

export default function VendedorView() {
  return (
    <VendedorProvider>
      <VendedorContent />
    </VendedorProvider>
  )
}
