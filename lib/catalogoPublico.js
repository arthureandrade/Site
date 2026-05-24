import { getProdutos } from '@/lib/api'
import { ehProdutoFerroAco, SECAO_FERRO_ACO } from '@/lib/catalogo'
import { normalizarCategoriaComercial, obterCategoriaMarcaPorMapa } from '@/lib/brandCategories'

const CATEGORIAS_MARCA = [
  { nome: 'Ferro e Aço', termos: ['aco', 'metalon', 'perfil', 'tubo', 'barra', 'cantoneira', 'vergalhao', 'trelica', 'chapa', 'tela'] },
  { nome: 'Construção e Coberturas', termos: ['cimento', 'argamassa', 'rejunte', 'massa', 'concreto', 'bloco', 'tijolo', 'telha', 'laje'] },
  { nome: 'Ferramentas e Máquinas', termos: ['betoneira', 'cortadora', 'furadeira', 'serra', 'maquina', 'motor', 'esmerilhadeira', 'compactador', 'lixadeira', 'vibratoria'] },
  { nome: 'Ferragens e Fixação', termos: ['parafuso', 'porca', 'arruela', 'fixador', 'corrente', 'cadeado', 'fechadura', 'dobradica', 'ferragem'] },
  { nome: 'Solda e Abrasivos', termos: ['solda', 'eletrodo', 'disco', 'abrasivo', 'corte', 'desbaste'] },
  { nome: 'Hidráulica', termos: ['torneira', 'registro', 'conexao', 'tubo pvc', 'hidraul', 'caixa d agua', 'valvula'] },
  { nome: 'Elétrica', termos: ['fio', 'cabo', 'disjuntor', 'tomada', 'lampada', 'led', 'eletroduto', 'eletric'] },
  { nome: 'Tintas e Químicos', termos: ['tinta', 'selador', 'verniz', 'thinner', 'solvente', 'impermeabil', 'silicone', 'cola', 'espuma'] },
]

export function normalizarTexto(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function inferirCategoriaMarca(marca, produtosDaMarca) {
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

export function montarMarcasCatalogo(produtos) {
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

export function produtoCasaBuscaCatalogo(produto, busca) {
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

export function ehProdutoRamassolCatalogo(produto) {
  return normalizarTexto(produto?.marca || '').includes('ramassol')
}

export function buscaEhRamassol(busca) {
  return normalizarTexto(busca).includes('ramassol')
}

export function calcularScoreComercial(produto) {
  const preco = Number(produto?.preco || 0)
  const estoque = Number(produto?.estoque || 0)
  return (preco + estoque) / 2
}

export function calcularScoreFerroAco(produto) {
  const nome = normalizarTexto(produto?.nome)
  if (nome.startsWith('perfil')) return 1000000 + calcularScoreComercial(produto)
  return calcularScoreComercial(produto)
}

export function buscaEhCodigo(busca) {
  return /^\d+$/.test(String(busca || '').trim())
}

export async function carregarCatalogoInicial({
  busca = '',
  marca = '',
  categoriaEspecial = '',
  secaoEspecial = '',
  subgrupoEspecial = '',
  emEstoque = true,
} = {}) {
  const ignorarEstoquePorCodigo = buscaEhCodigo(busca)

  if (categoriaEspecial === 'ferro_aco') {
    const data = await getProdutos({
      skip: 0,
      limit: 5000,
      com_preco: false,
      secao: String(SECAO_FERRO_ACO),
      em_estoque: !ignorarEstoquePorCodigo ? emEstoque : undefined,
      revalidate: 60,
    })

    let produtos = (data.produtos || []).filter(ehProdutoFerroAco)
    if (busca) produtos = produtos.filter((produto) => produtoCasaBuscaCatalogo(produto, busca))
    if (marca) {
      const marcaNormalizada = normalizarTexto(marca)
      produtos = produtos.filter((produto) =>
        normalizarTexto(produto.marca || '').includes(marcaNormalizada)
      )
    }

    const ordenados = [...produtos].sort((a, b) => calcularScoreFerroAco(b) - calcularScoreFerroAco(a))
    return {
      produtos: ordenados,
      marcasCatalogo: montarMarcasCatalogo(produtos),
    }
  }

  const buscaMarcaRamassol = buscaEhRamassol(busca) || buscaEhRamassol(marca)
  const data = await getProdutos(
    buscaMarcaRamassol
      ? {
          marca: 'ramassol',
          todas_secoes: true,
          com_preco: false,
          skip: 0,
          limit: 5000,
          revalidate: 60,
        }
      : {
          busca: busca || undefined,
          marca: marca || undefined,
          secao: secaoEspecial || undefined,
          subgrupo: subgrupoEspecial || undefined,
          em_estoque: !ignorarEstoquePorCodigo ? emEstoque : undefined,
          com_preco: true,
          skip: 0,
          limit: 5000,
          revalidate: 60,
        }
  )

  let produtos = (data.produtos || []).filter(
    (produto) => Number(produto.preco) > 0 || ehProdutoRamassolCatalogo(produto)
  )

  if (busca) {
    produtos = produtos.filter((produto) => produtoCasaBuscaCatalogo(produto, busca))
  }

  if (marca) {
    const marcaNormalizada = normalizarTexto(marca)
    produtos = produtos.filter(
      (produto) =>
        normalizarTexto(produto.marca || '').includes(marcaNormalizada) || ehProdutoRamassolCatalogo(produto)
    )
  }

  return {
    produtos: [...produtos].sort((a, b) => calcularScoreComercial(b) - calcularScoreComercial(a)),
    marcasCatalogo: montarMarcasCatalogo(produtos),
  }
}
