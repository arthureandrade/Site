'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import ProductCard from './ProductCard'
import { SkeletonGrid } from './SkeletonCard'
import { normalizarCategoriaComercial, obterCategoriaMarcaPorMapa } from '../lib/brandCategories'
import { ehProdutoFerroAco, SECAO_FERRO_ACO } from '../lib/catalogo'
import { getProdutos } from '../lib/api'

const CATEGORIAS_MARCA = [
  { nome: 'Ferro e Aco', termos: ['aco', 'metalon', 'perfil', 'tubo', 'barra', 'cantoneira', 'vergalhao', 'trelica', 'chapa', 'tela'] },
  { nome: 'Construcao e Coberturas', termos: ['cimento', 'argamassa', 'rejunte', 'massa', 'concreto', 'bloco', 'tijolo', 'telha', 'laje'] },
  { nome: 'Ferramentas e Maquinas', termos: ['betoneira', 'cortadora', 'furadeira', 'serra', 'maquina', 'motor', 'esmerilhadeira', 'compactador', 'lixadeira', 'vibratoria'] },
  { nome: 'Ferragens e Fixacao', termos: ['parafuso', 'porca', 'arruela', 'fixador', 'corrente', 'cadeado', 'fechadura', 'dobradica', 'ferragem'] },
  { nome: 'Solda e Abrasivos', termos: ['solda', 'eletrodo', 'disco', 'abrasivo', 'corte', 'desbaste'] },
  { nome: 'Hidraulica', termos: ['torneira', 'registro', 'conexao', 'tubo pvc', 'hidraul', 'caixa d agua', 'valvula'] },
  { nome: 'Eletrica', termos: ['fio', 'cabo', 'disjuntor', 'tomada', 'lampada', 'led', 'eletroduto', 'eletric'] },
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
      return normalizarCategoriaComercial(categoria.nome)
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
    .sort((a, b) => b.quantidade - a.quantidade || a.marca.localeCompare(b.marca, 'pt-BR'))
}

function produtoCasaBuscaCatalogo(produto, busca) {
  const buscaNormalizada = normalizarTexto(busca)
  const nome = normalizarTexto(produto?.nome || '')
  const descricao = normalizarTexto(produto?.descricao || '')
  const marca = normalizarTexto(produto?.marca || '')
  const codigo = String(produto?.id || '')
  return (
    nome.includes(buscaNormalizada) ||
    descricao.includes(buscaNormalizada) ||
    marca.includes(buscaNormalizada) ||
    codigo.includes(buscaNormalizada)
  )
}

function ehProdutoRamassolCatalogo(produto) {
  return normalizarTexto(produto?.marca || '').includes('ramassol')
}

function calcularScoreComercial(produto) {
  const preco = Number(produto?.preco || 0)
  const estoque = Number(produto?.estoque || 0)
  return (preco + estoque) / 2
}

function calcularScoreFerroAco(produto) {
  const nome = normalizarTexto(produto?.nome)
  if (nome.startsWith('perfil')) return 1000000 + calcularScoreComercial(produto)
  return calcularScoreComercial(produto)
}

function buscaEhCodigo(busca) {
  return /^\d+$/.test(String(busca || '').trim())
}

export default function ProdutosCliente({
  initialBusca = '',
  initialMarca = '',
  initialCategoria = '',
  initialSecao = '',
  initialSubgrupo = '',
}) {
  const [todosProdutos, setTodosProdutos] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(false)
  const [page, setPage] = useState(0)
  const [busca, setBusca] = useState(initialBusca)
  const [marcaFiltro, setMarcaFiltro] = useState(initialMarca)
  const [categoriaEspecial] = useState(initialCategoria)
  const [secaoEspecial] = useState(initialSecao)
  const [subgrupoEspecial] = useState(initialSubgrupo)
  const [buscaMarca, setBuscaMarca] = useState('')
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todas')
  const [emEstoque, setEmEstoque] = useState(true)
  const [marcasCatalogo, setMarcasCatalogo] = useState([])
  const [loadingMarcas, setLoadingMarcas] = useState(true)
  const [produtosPorPagina, setProdutosPorPagina] = useState(24)
  const [mostrarTodasCategorias, setMostrarTodasCategorias] = useState(false)
  const [mostrarTodasMarcas, setMostrarTodasMarcas] = useState(false)
  const [mostrarFiltrosMobile, setMostrarFiltrosMobile] = useState(false)

  const fetchProdutos = useCallback(async (_p = 0, busca_ = '', marca_ = '', est = true) => {
    setLoading(true)
    setErro(false)
    const ignorarEstoquePorCodigo = buscaEhCodigo(busca_)

    try {
      if (categoriaEspecial === 'ferro_aco') {
        const data = await getProdutos({
          skip: 0,
          limit: 5000,
          com_preco: false,
          secao: String(SECAO_FERRO_ACO),
          em_estoque: !ignorarEstoquePorCodigo ? est : undefined,
          noStore: true,
        })

        let filtrados = (data.produtos || []).filter(ehProdutoFerroAco)
        if (busca_) {
          filtrados = filtrados.filter((produto) => produtoCasaBuscaCatalogo(produto, busca_))
        }
        if (marca_) {
          const marcaNormalizada = normalizarTexto(marca_)
          filtrados = filtrados.filter((produto) =>
            normalizarTexto(produto.marca || '').includes(marcaNormalizada)
          )
        }

        setTodosProdutos(
          [...filtrados].sort((a, b) => calcularScoreFerroAco(b) - calcularScoreFerroAco(a))
        )
      } else {
        const data = await getProdutos({
          busca: busca_ || undefined,
          marca: marca_ || undefined,
          secao: secaoEspecial || undefined,
          subgrupo: subgrupoEspecial || undefined,
          em_estoque: !ignorarEstoquePorCodigo ? est : undefined,
          com_preco: true,
          skip: 0,
          limit: 5000,
          noStore: true,
        })
        const produtosValidos = (data.produtos || []).filter(
          (produto) => Number(produto.preco) > 0 || ehProdutoRamassolCatalogo(produto)
        )
        setTodosProdutos(
          [...produtosValidos].sort((a, b) => calcularScoreComercial(b) - calcularScoreComercial(a))
        )
      }
    } catch {
      setErro(true)
    } finally {
      setLoading(false)
    }
  }, [categoriaEspecial, secaoEspecial, subgrupoEspecial])

  const fetchMarcas = useCallback(async () => {
    setLoadingMarcas(true)
    try {
      const data = await getProdutos({
        skip: 0,
        limit: 5000,
        com_preco: categoriaEspecial === 'ferro_aco' ? false : true,
        secao:
          categoriaEspecial === 'ferro_aco'
            ? String(SECAO_FERRO_ACO)
            : secaoEspecial || undefined,
        subgrupo:
          categoriaEspecial === 'ferro_aco'
            ? undefined
            : subgrupoEspecial || undefined,
        noStore: true,
      })
      const produtosValidos =
        categoriaEspecial === 'ferro_aco'
          ? (data.produtos || []).filter(ehProdutoFerroAco)
          : (data.produtos || []).filter(
              (produto) => Number(produto.preco) > 0 || ehProdutoRamassolCatalogo(produto)
            )
      setMarcasCatalogo(montarMarcasCatalogo(produtosValidos))
    } catch {
      setMarcasCatalogo([])
    } finally {
      setLoadingMarcas(false)
    }
  }, [categoriaEspecial, secaoEspecial, subgrupoEspecial])

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
  const categoriasResumo = categorias
    .filter((categoria) => categoria !== 'Todas')
    .map((categoria) => ({
      nome: categoria,
      quantidade: marcasCatalogo.filter((item) => item.categoria === categoria).length,
    }))
    .sort((a, b) => b.quantidade - a.quantidade || a.nome.localeCompare(b.nome, 'pt-BR'))

  const marcasFiltradas = marcasCatalogo.filter((item) => {
    const casaCategoria = categoriaAtiva === 'Todas' || item.categoria === categoriaAtiva
    const casaBuscaMarca =
      !buscaMarca || normalizarTexto(item.marca).includes(normalizarTexto(buscaMarca))
    return casaCategoria && casaBuscaMarca
  })

  const produtosFiltradosPorCategoria = useMemo(() => {
    if (categoriaAtiva === 'Todas') return todosProdutos
    return todosProdutos.filter(
      (produto) => inferirCategoriaMarca(produto.marca, [produto]) === categoriaAtiva
    )
  }, [categoriaAtiva, todosProdutos])

  const categoriasVisiveis = mostrarTodasCategorias
    ? categoriasResumo
    : categoriasResumo.slice(0, 6)
  const marcasVisiveis = mostrarTodasMarcas ? marcasFiltradas : marcasFiltradas.slice(0, 8)
  const totalFiltrado = produtosFiltradosPorCategoria.length
  const totalPages = Math.ceil(totalFiltrado / produtosPorPagina)
  const produtosPaginados = useMemo(
    () =>
      produtosFiltradosPorCategoria.slice(
        page * produtosPorPagina,
        page * produtosPorPagina + produtosPorPagina
      ),
    [produtosFiltradosPorCategoria, page, produtosPorPagina]
  )

  useEffect(() => {
    const novoTotalPages = Math.max(1, Math.ceil(totalFiltrado / produtosPorPagina))
    if (page > novoTotalPages - 1) setPage(0)
  }, [page, produtosPorPagina, totalFiltrado])

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
        <button
          type="button"
          onClick={() => setMostrarFiltrosMobile((valor) => !valor)}
          className="inline-flex items-center justify-center rounded-2xl border border-gray-300 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-brand shadow-sm"
        >
          {mostrarFiltrosMobile ? 'Fechar filtros' : 'Abrir filtros'}
        </button>
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
          {totalFiltrado.toLocaleString('pt-BR')} itens
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className={`${mostrarFiltrosMobile ? 'block' : 'hidden'} lg:block`}>
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-white/10 bg-brand px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.25em] text-primary">Catalogo</p>
                  <h2 className="font-display text-2xl uppercase leading-none text-white">Filtros laterais</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setMostrarFiltrosMobile(false)}
                  className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-white lg:hidden"
                >
                  Fechar
                </button>
              </div>
            </div>

            <div className="space-y-5 p-5">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
                  Buscar produto
                </label>
                <input
                  type="text"
                  placeholder="Ex: parafuso, 295, ramassol..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="input text-sm"
                />
                <p className="mt-2 text-[11px] font-medium text-gray-400">
                  Busque por nome, código ou marca.
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Disponibilidade</p>
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
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-base font-bold text-gray-800">Categorias</p>
                  <button
                    type="button"
                    className="text-primary"
                    onClick={() => setCategoriaAtiva('Todas')}
                    aria-label="Limpar categoria"
                  >
                    <span className="text-lg leading-none">⌃</span>
                  </button>
                </div>
                <div className="space-y-2 rounded-2xl border border-gray-200 p-3">
                  {categoriasVisiveis.map((item) => (
                    <button
                      key={item.nome}
                      type="button"
                      onClick={() => {
                        setCategoriaAtiva(item.nome)
                        setPage(0)
                      }}
                      className={`flex w-full items-center justify-between gap-3 rounded-xl px-2 py-2 text-left transition ${
                        categoriaAtiva === item.nome ? 'bg-red-50 text-primary' : 'hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-sm font-semibold text-gray-800">{item.nome}</span>
                      <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-bold text-gray-500">
                        {item.quantidade}
                      </span>
                    </button>
                  ))}
                  {categoriasResumo.length > 6 && (
                    <button
                      type="button"
                      onClick={() => setMostrarTodasCategorias((valor) => !valor)}
                      className="pt-1 text-sm font-black text-primary"
                    >
                      {mostrarTodasCategorias ? 'Ver menos' : 'Ver mais'}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-base font-bold text-gray-800">Marcas</p>
                  <button
                    type="button"
                    className="text-primary"
                    onClick={() => setMarcaFiltro('')}
                    aria-label="Limpar marca"
                  >
                    <span className="text-lg leading-none">⌃</span>
                  </button>
                </div>

                <div className="rounded-2xl border border-gray-200 p-3">
                  <div className="mb-3 flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2">
                    <input
                      type="text"
                      placeholder="Busque por Marcas..."
                      value={buscaMarca}
                      onChange={(e) => setBuscaMarca(e.target.value)}
                      className="w-full bg-transparent text-sm outline-none"
                    />
                    <span className="text-gray-400">⌕</span>
                  </div>

                  <div className="space-y-2">
                    {loadingMarcas ? (
                      <p className="text-sm text-gray-400">Carregando marcas...</p>
                    ) : marcasFiltradas.length === 0 ? (
                      <p className="text-sm text-gray-400">Nenhuma marca encontrada.</p>
                    ) : (
                      marcasVisiveis.map((item) => (
                        <button
                          key={item.marca}
                          onClick={() => {
                            setMarcaFiltro(item.marca === marcaFiltro ? '' : item.marca)
                            setPage(0)
                          }}
                          className={`w-full rounded-xl px-2 py-2 text-left transition-colors ${
                            marcaFiltro === item.marca ? 'bg-red-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <span
                                className={`h-4 w-4 rounded border ${
                                  marcaFiltro === item.marca
                                    ? 'border-primary bg-primary'
                                    : 'border-gray-300 bg-white'
                                }`}
                              />
                              <p className="truncate text-sm font-semibold text-gray-900">{item.marca}</p>
                            </div>
                            <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-bold text-gray-500">
                              {item.quantidade}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  {marcasFiltradas.length > 8 && (
                    <button
                      type="button"
                      onClick={() => setMostrarTodasMarcas((valor) => !valor)}
                      className="pt-3 text-sm font-black text-primary"
                    >
                      {mostrarTodasMarcas ? 'Ver menos' : 'Ver mais'}
                    </button>
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
          <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:mb-6 sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="mb-3 h-1 w-12 rounded bg-primary" />
                <h3 className="font-display text-2xl uppercase text-gray-900 sm:text-3xl">Catalogo de Produtos</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {categoriaEspecial === 'ferro_aco'
                    ? 'Catalogo de aco da secao 6. Exibicao sem preco e sem estoque, apenas para mostrar o mix disponivel.'
                    : secaoEspecial && subgrupoEspecial
                      ? `Exibindo produtos da secao ${secaoEspecial} e subgrupo ${subgrupoEspecial}.`
                      : subgrupoEspecial
                        ? `Exibindo produtos do subgrupo ${subgrupoEspecial}.`
                        : 'Exibindo produtos com preco e itens estrategicos de marca. Use a lateral para navegar por categorias e marcas.'}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                {marcaFiltro && (
                  <span className="rounded-full bg-red-50 px-3 py-1.5 font-bold uppercase tracking-wide text-primary">
                    Marca: {marcaFiltro}
                  </span>
                )}
                <span className="rounded-full bg-gray-100 px-3 py-1.5 font-bold uppercase tracking-wide text-gray-600">
                  {totalFiltrado.toLocaleString('pt-BR')} produto{totalFiltrado !== 1 ? 's' : ''}
                </span>
                <span className="rounded-full bg-amber-50 px-3 py-1.5 font-bold uppercase tracking-wide text-amber-700">
                  Ordenado pela media entre valor e estoque
                </span>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                  Itens por pagina
                </label>
                <select
                  value={produtosPorPagina}
                  onChange={(e) => {
                    setProdutosPorPagina(Number(e.target.value))
                    setPage(0)
                  }}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 outline-none"
                >
                  {[12, 24, 36, 48].map((valor) => (
                    <option key={valor} value={valor}>
                      {valor}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <SkeletonGrid count={produtosPorPagina} />
          ) : erro ? (
            <div className="py-20 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-black uppercase text-gray-800">Nao foi possivel carregar os produtos</h3>
              <p className="mb-6 text-sm text-gray-500">Verifique a conexao com a API.</p>
              <button onClick={() => fetchProdutos(page, busca, marcaFiltro, emEstoque)} className="btn-primary">
                Tentar novamente
              </button>
            </div>
          ) : produtosPaginados.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-20 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-black uppercase text-gray-800">Nenhum produto encontrado</h3>
              <p className="mb-6 text-sm text-gray-500">Tente outras marcas, categorias ou termos de busca.</p>
              <button onClick={limparFiltros} className="btn-primary">
                Limpar filtros
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
                {produtosPaginados.map((produto) => (
                  <ProductCard
                    key={produto.id}
                    produto={produto}
                    ocultarPreco={categoriaEspecial === 'ferro_aco'}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
                  <button
                    disabled={page === 0}
                    onClick={() => handlePage(page - 1)}
                    className="rounded border border-gray-300 px-4 py-2 text-sm font-bold uppercase tracking-wide transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ← Anterior
                  </button>

                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    const pg =
                      totalPages <= 7
                        ? i
                        : page < 4
                          ? i
                          : page > totalPages - 5
                            ? totalPages - 7 + i
                            : page - 3 + i

                    return (
                      <button
                        key={pg}
                        onClick={() => handlePage(pg)}
                        className={`h-10 w-10 rounded text-sm font-black transition-all ${
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
                    className="rounded border border-gray-300 px-4 py-2 text-sm font-bold uppercase tracking-wide transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
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
