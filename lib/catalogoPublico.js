import { getProdutos } from '@/lib/api'
import { ehProdutoFerroAco, SECAO_FERRO_ACO } from '@/lib/catalogo'
import { normalizarCategoriaComercial, obterCategoriaMarcaPorMapa } from '@/lib/brandCategories'
import { obterNomeGrupoErp } from '@/lib/erpGroups'

export const CATEGORIAS_CATALOGO = [
  {
    nome: 'Portas e Janelas',
    termosFortes: ['janela', 'porta abrir', 'porta laminada', 'porta veneziana', 'basculh*', 'basculante', 'postigo', 'veneziana'],
    termos: ['porta', 'grade corrente', 'grade quadriculada'],
  },
  {
    nome: 'Telhas e Coberturas',
    termosFortes: ['telha', 'cumeeira', 'rufo', 'calha', 'galvalume', 'fibrocimento', 'policarbonato', 'lona azul'],
    termos: ['eternit', 'forro pvc', 'lona', 'cobertura'],
  },
  {
    nome: 'Aço e Perfis',
    termosFortes: ['metalon', 'vergalhao', 'cantoneira', 'perfil u', 'perfil c', 'barra chata', 'tela soldada', 'malha pop', 'trelica', 'arame farpado', 'arame galv', 'arame liso', 'arame ovalado', 'arame recozido'],
    termos: ['aco', 'ferro', 'barra', 'chapa', 'tubo industrial'],
  },
  {
    nome: 'Ferramentas',
    termosFortes: ['furadeira*', 'parafusadeira*', 'esmerilhadeira*', 'serra*', 'broca*', 'martelete', 'betoneira', 'compactador', 'lixadeira', 'ancinho', 'enxada', 'corta-vergalhao', 'cortador de vergalhao', 'alisadora de concreto', 'elevador moto hidraulico', 'aspirador', 'aparador de grama', 'bigorna', 'bit de', 'adaptador p soquete', 'soquete'],
    termos: ['alicate', 'chave', 'martelo', 'marreta', 'trena', 'nivel', 'cortador', 'desempenadeira', 'colher p pedreiro', 'pa quadrada', 'pa de bico', 'alavanca'],
  },
  {
    nome: 'Elétrica',
    termosFortes: ['disjuntor', 'tomada', 'interruptor', 'eletroduto', 'quadro de distribuicao', 'lampada', 'cabo flex', 'fio flex'],
    termos: ['plug', 'led', 'eletric*', 'conduite', 'caixa luz', 'benjamim', 'bateria'],
  },
  {
    nome: 'Hidráulica',
    termosFortes: ['tubo pvc', 'joelho', 'luva esgoto', 'luva soldavel', 'torneira', 'registro', 'caixa d agua', 'valvula', 'sifao', 'ralo', 'adaptador sold', 'adaptador pvc', 'assento sanitario', 'aquecedor de agua'],
    termos: ['conexao', 'hidraul*', 'cola pvc'],
  },
  {
    nome: 'Ferragens',
    termosFortes: ['parafuso*', 'chumbador', 'prego', 'porca', 'arruela', 'rebite', 'cadeado', 'fechadura', 'dobradica', 'bucha', 'grampo', 'abracadeira', 'abrac', 'armador'],
    termos: ['corrente', 'gancho', 'fixador', 'ferragem', 'abraçadeira'],
  },
  {
    nome: 'Cimento e Argamassa',
    termosFortes: ['argamassa', 'rejunte', 'cimento', 'bloco', 'tijolo'],
    termos: ['concreto usinado', 'massa pronta', 'cola piso', 'laje'],
  },
  {
    nome: 'Tintas e Químicos',
    termosFortes: ['tinta', 'spray tinta', 'selador', 'verniz', 'thinner', 'solvente', 'silicone', 'espuma expansiva', 'impermeabilizante', 'adesivo', 'aguarras', 'aditivo plastificante', 'airless', 'bandeja p pintura'],
    termos: ['cola', 'vedante', 'removedor', 'resina', 'lubrificante', 'quimic*', 'impermeabil*'],
  },
  {
    nome: 'Solda e Abrasivos',
    termosFortes: ['eletrodo', 'arame solda', 'arame mig', 'barra solda', 'mascara de solda', 'disco corte', 'disco flap', 'disco desbaste', 'disco diamantado', 'bico corte acetileno', 'bico corte glp'],
    termos: ['solda', 'abrasivo', 'desbaste', 'esmeril'],
  },
  {
    nome: 'EPIs',
    termosFortes: ['abafador', 'bota', 'luva de', 'luva vaqueta', 'luva malha', 'capacete', 'oculos', 'protetor auricular', 'protetor auditivo', 'respirador', 'capa pvc'],
    termos: ['epi', 'mascara', 'avental', 'seguranca'],
  },
  {
    nome: 'Utilidades e Jardim',
    termosFortes: ['balde', 'vassoura', 'mangueira jardim', 'churrasqueira', 'escada', 'caixa plastica', 'chapa p fogao', 'fogao camping', 'bebedouro', 'barraca', 'aro aluminio'],
    termos: ['jardim', 'utilidade', 'organizador'],
  },
]

const REGRAS_PRIORITARIAS_CATEGORIA = [
  {
    nome: 'Tintas e Químicos',
    termos: ['veda telha', 'adesivo', 'aguarras', 'vedante', 'selador', 'verniz', 'thinner', 'solvente', 'silicone'],
  },
  {
    nome: 'Utilidades e Jardim',
    termos: ['fogao camping', 'chapa p fogao', 'churrasqueira', 'bebedouro'],
  },
  {
    nome: 'Ferragens',
    termos: ['parafuso*', 'chumbador', 'prego', 'porca', 'arruela', 'rebite', 'cadeado', 'fechadura', 'dobradica', 'bucha', 'grampo'],
  },
  {
    nome: 'Hidráulica',
    termos: ['adaptador sold', 'luva esgoto', 'luva soldavel', 'joelho', 'tubo pvc', 'assento sanitario'],
  },
]

export function normalizarTexto(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function escaparRegExp(valor) {
  return String(valor).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function prepararTextoClassificacao(produto) {
  return normalizarTexto([
    produto?.nome,
    produto?.descricao,
    produto?.marca,
    produto?.foto_url,
    produto?.fallback_foto_url,
    produto?.image,
  ].filter(Boolean).join(' '))
}

function termoCasaCategoria(base, termo) {
  const termoNormalizado = normalizarTexto(termo).trim()
  if (!termoNormalizado) return false

  if (termoNormalizado.includes(' ')) {
    return base.includes(termoNormalizado)
  }

  if (termoNormalizado.endsWith('*')) {
    const prefixo = termoNormalizado.slice(0, -1)
    const regexPrefixo = new RegExp(`(^|[^a-z0-9])${escaparRegExp(prefixo)}[a-z0-9]*`, 'i')
    return regexPrefixo.test(base)
  }

  const regex = new RegExp(`(^|[^a-z0-9])${escaparRegExp(termoNormalizado)}([^a-z0-9]|$)`, 'i')
  return regex.test(base)
}

function calcularPontuacaoCategoria(base, categoria) {
  const fortes = categoria.termosFortes || []
  const termos = categoria.termos || []
  const pontosFortes = fortes.reduce(
    (total, termo) => total + (termoCasaCategoria(base, termo) ? 4 : 0),
    0
  )
  const pontosGerais = termos.reduce(
    (total, termo) => total + (termoCasaCategoria(base, termo) ? 1 : 0),
    0
  )
  return pontosFortes + pontosGerais
}

export function inferirCategoriaProduto(produto) {
  return obterNomeGrupoErp(produto) || 'Outros produtos'
}

export function inferirCategoriaMarca(marca, produtosDaMarca) {
  const categoriaPesquisada = obterCategoriaMarcaPorMapa(marca)
  if (categoriaPesquisada) return categoriaPesquisada

  const base = normalizarTexto(
    produtosDaMarca
      .map((p) => `${p.nome || ''} ${p.descricao || ''} ${p.marca || ''}`)
      .join(' ')
  )

  for (const categoria of CATEGORIAS_CATALOGO) {
    if (calcularPontuacaoCategoria(base, categoria) > 0) {
      return normalizarCategoriaComercial(categoria.nome)
    }
  }

  return 'Outras marcas'
}

export function montarCategoriasCatalogo(produtos) {
  const mapa = new Map()

  for (const produto of produtos || []) {
    const categoria = inferirCategoriaProduto(produto)
    mapa.set(categoria, (mapa.get(categoria) || 0) + 1)
  }

  return Array.from(mapa.entries())
    .map(([nome, quantidade]) => ({ nome, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade || a.nome.localeCompare(b.nome, 'pt-BR'))
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
      categoria: montarCategoriasCatalogo(itens)[0]?.nome || inferirCategoriaMarca(marca, itens),
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
      categoriasCatalogo: montarCategoriasCatalogo(produtos),
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
    categoriasCatalogo: montarCategoriasCatalogo(produtos),
  }
}
