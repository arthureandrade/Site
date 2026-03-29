'use client'
import { useState, useEffect, useCallback } from 'react'
import ProductCard from './ProductCard'
import { SkeletonGrid } from './SkeletonCard'
import { obterCategoriaMarcaPorMapa } from '../lib/brandCategories'

const LIMIT = 24
const CATEGORIAS_MARCA = [
  { nome: 'Acos e Estruturas', termos: ['aco', 'metalon', 'perfil', 'tubo', 'barra', 'cantoneira', 'vergalhao', 'trelica', 'telha'] },
  { nome: 'Cimentos e Construcao', termos: ['cimento', 'argamassa', 'rejunte', 'massa', 'concreto', 'bloco', 'tijolo', 'telha', 'laje'] },
  { nome: 'Ferramentas e Maquinas', termos: ['betoneira', 'cortadora', 'furadeira', 'serra', 'maquina', 'motor', 'esmerilhadeira', 'compactador', 'lixadeira', 'vibratoria'] },
  { nome: 'Fixacao e Ferragens', termos: ['parafuso', 'porca', 'arruela', 'fixador', 'corrente', 'cadeado', 'fechadura', 'dobradica', 'ferragem'] },
  { nome: 'Solda e Abrasivos', termos: ['solda', 'eletrodo', 'disco', 'abrasivo', 'corte', 'desbaste'] },
  { nome: 'Hidraulica e Conexoes', termos: ['torneira', 'registro', 'conexao', 'tubo pvc', 'hidraul', 'caixa d agua', 'valvula'] },
  { nome: 'Eletrica e Iluminacao', termos: ['fio', 'cabo', 'disjuntor', 'tomada', 'lampada', 'led', 'eletroduto', 'eletric'] },
  { nome: 'Tintas e Quimicos', termos: ['tinta', 'selador', 'verniz', 'thinner', 'solvente', 'impermeabil', 'silicone', 'cola', 'espuma'] },
]

function normalizarTexto(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function inferirCategoriaMarca(marca, produtosDaMarca) {
  const categoriaPesquisada = obterCategoriaMarcaPorMapa(marca)
  if (categoriaPesquisada) return categoriaPesquisada

  const base = normalizarTexto(
    produtosDaMarca
      .map((p) => `${p.nome || ''} ${p.descricao || ''} ${p.marca || ''}`)
      .join(' ')
  )

  for (const categoria of CATEGORIAS_MARCA) {
    if (categoria.termos.some((termo) => base.includes(termo))) {
      return categoria.nome
    }
  }

  return 'Outras marcas'
}

function montarMarcasCatalogo(produtos) {
  const mapa = new Map()

  for (const produto of produtos) {
    if (!produto?.marca) continue
    const marca = String(produto.marca).trim()
    if (!marca || marca.toUpperCase() === 'GERAL') continue

    if (!mapa.has(marca)) mapa.set(marca, [])
    mapa.get(marca).push(produto)
  }

  return Array.from(mapa.entries())
    .map(([marca, itens]) => ({
      marca,
      categoria: inferirCategoriaMarca(marca, itens),
      quantidade: itens.length,
    }))
    .sort((a, b) => a.marca.localeCompare(b.marca, 'pt-BR'))
}

export default function ProdutosCliente({ initialBusca = '', initialMarca = '' }) {
  const [produtos, setProdutos] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(false)
  const [page, setPage] = useState(0)
  const [busca, setBusca] = useState(initialBusca)
  const [marcaFiltro, setMarcaFiltro] = useState(initialMarca)
  const [buscaMarca, setBuscaMarca] = useState('')
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todas')
  const [emEstoque, setEmEstoque] = useState(true)
  const [marcasCatalogo, setMarcasCatalogo] = useState([])
  const [loadingMarcas, setLoadingMarcas] = useState(true)

  const apiUrl =
    (typeof window !== 'undefined' && window.__ENV_API_URL__) ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:8000'

  const fetchProdutos = useCallback(async (p = 0, busca_ = '', marca_ = '', est = true) => {
    setLoading(true)
    setErro(false)

    const qs = new URLSearchParams({ skip: p * LIMIT, limit: LIMIT, com_preco: 'true' })
    if (busca_) qs.set('busca', busca_)
    if (marca_) qs.set('marca', marca_)
    if (est != null) qs.set('em_estoque', est)

    try {
      const res = await fetch(`${apiUrl}/produtos?${qs}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      const produtosValidos = (data.produtos || []).filter((produto) => Number(produto.preco) > 0)
      setProdutos(produtosValidos)
      setTotal(data.total || 0)
    } catch {
      setErro(true)
    } finally {
      setLoading(false)
    }
  }, [apiUrl])

  const fetchMarcas = useCallback(async () => {
    setLoadingMarcas(true)
    try {
      const qs = new URLSearchParams({ skip: 0, limit: 5000, com_preco: 'true' })
      const res = await fetch(`${apiUrl}/produtos?${qs}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      const produtosValidos = (data.produtos || []).filter((produto) => Number(produto.preco) > 0)
      setMarcasCatalogo(montarMarcasCatalogo(produtosValidos))
    } catch {
      setMarcasCatalogo([])
    } finally {
      setLoadingMarcas(false)
    }
  }, [apiUrl])

  useEffect(() => {
    fetchProdutos(0, initialBusca, initialMarca, true)
    fetchMarcas()
  }, [fetchProdutos, fetchMarcas, initialBusca, initialMarca])

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(0)
      fetchProdutos(0, busca, marcaFiltro, emEstoque)
    }, 350)
    return () => clearTimeout(t)
  }, [busca, marcaFiltro, emEstoque, fetchProdutos])

  function handlePage(nova) {
    setPage(nova)
    fetchProdutos(nova, busca, marcaFiltro, emEstoque)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function limparFiltros() {
    setBusca('')
    setMarcaFiltro('')
    setBuscaMarca('')
    setCategoriaAtiva('Todas')
    setEmEstoque(true)
    setPage(0)
    fetchProdutos(0, '', '', true)
  }

  const categorias = ['Todas', ...new Set(marcasCatalogo.map((item) => item.categoria))]
  const marcasFiltradas = marcasCatalogo.filter((item) => {
    const casaCategoria = categoriaAtiva === 'Todas' || item.categoria === categoriaAtiva
    const casaBuscaMarca = !buscaMarca || normalizarTexto(item.marca).includes(normalizarTexto(buscaMarca))
    return casaCategoria && casaBuscaMarca
  })
  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid gap-6 lg:grid-cols-[290px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-brand px-5 py-4 border-b border-white/10">
              <p className="text-[11px] uppercase tracking-[0.25em] text-primary font-bold mb-1">Catalogo</p>
              <h2 className="font-display text-2xl text-white uppercase leading-none">Filtros laterais</h2>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Buscar produto
                </label>
                <input
                  type="text"
                  placeholder="Ex: parafuso, tubo, cimento..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="input text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Buscar marca
                </label>
                <input
                  type="text"
                  placeholder="Digite o nome da marca"
                  value={buscaMarca}
                  onChange={(e) => setBuscaMarca(e.target.value)}
                  className="input text-sm"
                />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Disponibilidade</p>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { label: 'Somente com estoque', val: true },
                    { label: 'Todos os produtos', val: null },
                    { label: 'Somente sem estoque', val: false },
                  ].map((opt) => (
                    <button
                      key={String(opt.val)}
                      onClick={() => setEmEstoque(opt.val)}
                      className={`rounded-xl border px-3 py-2 text-left text-sm font-semibold transition-colors ${
                        emEstoque === opt.val
                          ? 'border-primary bg-red-50 text-primary'
                          : 'border-gray-200 text-gray-600 hover:border-primary/30 hover:bg-gray-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Categorias de marcas</p>
                <div className="flex flex-wrap gap-2">
                  {categorias.map((categoria) => {
                    const quantidade =
                      categoria === 'Todas'
                        ? marcasCatalogo.length
                        : marcasCatalogo.filter((item) => item.categoria === categoria).length
                    return (
                      <button
                        key={categoria}
                        onClick={() => setCategoriaAtiva(categoria)}
                        className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
                          categoriaAtiva === categoria
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {categoria} ({quantidade})
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Marcas</p>
                  <span className="text-xs text-gray-400">{marcasFiltradas.length}</span>
                </div>

                <div className="max-h-[360px] overflow-y-auto pr-1 space-y-2">
                  {loadingMarcas ? (
                    <p className="text-sm text-gray-400">Carregando marcas...</p>
                  ) : marcasFiltradas.length === 0 ? (
                    <p className="text-sm text-gray-400">Nenhuma marca encontrada.</p>
                  ) : (
                    marcasFiltradas.map((item) => (
                      <button
                        key={item.marca}
                        onClick={() => {
                          setMarcaFiltro(item.marca === marcaFiltro ? '' : item.marca)
                          setPage(0)
                        }}
                        className={`w-full rounded-xl border px-3 py-2 text-left transition-colors ${
                          marcaFiltro === item.marca
                            ? 'border-primary bg-red-50'
                            : 'border-gray-200 hover:border-primary/30 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900">{item.marca}</p>
                            <p className="truncate text-[11px] uppercase tracking-wider text-gray-400">{item.categoria}</p>
                          </div>
                          <span className="rounded-full bg-gray-100 px-2 py-1 text-[11px] font-bold text-gray-500">
                            {item.quantidade}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <button onClick={limparFiltros} className="btn-outline w-full justify-center text-sm">
                Limpar filtros
              </button>
            </div>
          </div>
        </aside>

        <section>
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5 mb-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="h-1 w-12 bg-primary rounded mb-3" />
                <h3 className="font-display text-3xl text-gray-900 uppercase">Catalogo de Produtos</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Exibindo apenas produtos com preco. Use a lateral para navegar por marcas e categorias.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                {marcaFiltro && (
                  <span className="rounded-full bg-red-50 px-3 py-1.5 font-bold uppercase tracking-wide text-primary">
                    Marca: {marcaFiltro}
                  </span>
                )}
                <span className="rounded-full bg-gray-100 px-3 py-1.5 font-bold uppercase tracking-wide text-gray-600">
                  {total.toLocaleString('pt-BR')} produto{total !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          {loading ? (
            <SkeletonGrid count={LIMIT} />
          ) : erro ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z"/>
                </svg>
              </div>
              <h3 className="text-xl font-black text-gray-800 mb-2 uppercase">Nao foi possivel carregar os produtos</h3>
              <p className="text-gray-500 mb-6 text-sm">Verifique a conexao com a API.</p>
              <button onClick={() => fetchProdutos(page, busca, marcaFiltro, emEstoque)} className="btn-primary">
                Tentar novamente
              </button>
            </div>
          ) : produtos.length === 0 ? (
            <div className="text-center py-20 rounded-2xl border border-dashed border-gray-300 bg-white">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
                </svg>
              </div>
              <h3 className="text-xl font-black text-gray-800 mb-2 uppercase">Nenhum produto encontrado</h3>
              <p className="text-gray-500 mb-6 text-sm">Tente outras marcas, categorias ou termos de busca.</p>
              <button onClick={limparFiltros} className="btn-primary">
                Limpar filtros
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {produtos.map((produto) => (
                  <ProductCard key={produto.id} produto={produto} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10 flex-wrap">
                  <button
                    disabled={page === 0}
                    onClick={() => handlePage(page - 1)}
                    className="px-4 py-2 rounded border border-gray-300 text-sm font-bold uppercase tracking-wide disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                  >
                    ← Anterior
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
                        className={`w-10 h-10 rounded text-sm font-black transition-all ${
                          pg === page
                            ? 'bg-primary text-white shadow-md'
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
                    className="px-4 py-2 rounded border border-gray-300 text-sm font-bold uppercase tracking-wide disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                  >
                    Proxima →
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}
