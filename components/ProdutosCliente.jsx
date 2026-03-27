'use client'
import { useState, useEffect, useCallback } from 'react'
import ProductCard from './ProductCard'
import { SkeletonGrid } from './SkeletonCard'

const LIMIT = 24

export default function ProdutosCliente() {
  const [produtos,    setProdutos]    = useState([])
  const [total,       setTotal]       = useState(0)
  const [loading,     setLoading]     = useState(true)
  const [erro,        setErro]        = useState(false)
  const [page,        setPage]        = useState(0)           // página atual (base 0)
  const [busca,       setBusca]       = useState('')
  const [marcaFiltro, setMarcaFiltro] = useState('')
  const [emEstoque,   setEmEstoque]   = useState(null)        // null | true | false

  const apiUrl =
    (typeof window !== 'undefined' && window.__ENV_API_URL__) ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:8000'

  const fetchProdutos = useCallback(async (p = 0, marca = '', est = null) => {
    setLoading(true)
    setErro(false)

    const qs = new URLSearchParams({ skip: p * LIMIT, limit: LIMIT })
    if (marca) qs.set('marca', marca)
    if (est != null) qs.set('em_estoque', est)

    try {
      const res = await fetch(`${apiUrl}/produtos?${qs}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setProdutos(data.produtos || [])
      setTotal(data.total || 0)
    } catch {
      setErro(true)
    } finally {
      setLoading(false)
    }
  }, [apiUrl])

  // Busca ao montar
  useEffect(() => { fetchProdutos(0, marcaFiltro, emEstoque) }, [])

  // Busca por marca com debounce
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(0)
      fetchProdutos(0, busca, emEstoque)
      setMarcaFiltro(busca)
    }, 400)
    return () => clearTimeout(t)
  }, [busca])

  function handleEstoque(val) {
    setEmEstoque(val)
    setPage(0)
    fetchProdutos(0, marcaFiltro, val)
  }

  function handlePage(nova) {
    setPage(nova)
    fetchProdutos(nova, marcaFiltro, emEstoque)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <>
      {/* ── FILTROS ──────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3">

          {/* Busca por marca */}
          <div className="relative flex-1 min-w-[200px]">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
            </svg>
            <input
              type="text"
              placeholder="Buscar por marca ou fabricante..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="input pl-9 text-sm"
            />
          </div>

          {/* Filtro estoque */}
          <div className="flex items-center gap-1 text-sm">
            {[
              { label: 'Todos',       val: null  },
              { label: 'Em estoque',  val: true  },
              { label: 'Sem estoque', val: false },
            ].map(opt => (
              <button
                key={String(opt.val)}
                onClick={() => handleEstoque(opt.val)}
                className={`px-3 py-2 rounded-lg font-medium transition-all ${
                  emEstoque === opt.val
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Contador */}
          <span className="text-sm text-gray-400 ml-auto hidden sm:block">
            {total.toLocaleString('pt-BR')} produto{total !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* ── GRID ─────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <SkeletonGrid count={LIMIT} />
        ) : erro ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">Não foi possível carregar os produtos</h3>
            <p className="text-gray-500 mb-6">Verifique a conexão com a API.</p>
            <button
              onClick={() => fetchProdutos(page, marcaFiltro, emEstoque)}
              className="btn-primary"
            >
              Tentar novamente
            </button>
          </div>
        ) : produtos.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">Nenhum produto encontrado</h3>
            <p className="text-gray-500 mb-6">Tente alterar os filtros.</p>
            <button
              onClick={() => { setBusca(''); setEmEstoque(null); fetchProdutos(0, '', null) }}
              className="btn-outline"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {produtos.map(p => <ProductCard key={p.id} produto={p} />)}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10 flex-wrap">
                <button
                  disabled={page === 0}
                  onClick={() => handlePage(page - 1)}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium
                             disabled:opacity-40 disabled:cursor-not-allowed
                             hover:bg-gray-50 transition-colors"
                >
                  ← Anterior
                </button>

                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const pg = totalPages <= 7 ? i
                    : page < 4     ? i
                    : page > totalPages - 5 ? totalPages - 7 + i
                    : page - 3 + i
                  return (
                    <button
                      key={pg}
                      onClick={() => handlePage(pg)}
                      className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all ${
                        pg === page
                          ? 'bg-primary text-white shadow-md'
                          : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {pg + 1}
                    </button>
                  )
                })}

                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => handlePage(page + 1)}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium
                             disabled:opacity-40 disabled:cursor-not-allowed
                             hover:bg-gray-50 transition-colors"
                >
                  Próxima →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
