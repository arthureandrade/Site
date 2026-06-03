import { getProdutos } from '@/lib/api'
import { ehProdutoFerroAco, SECAO_FERRO_ACO } from '@/lib/catalogo'
import { normalizarCategoriaComercial, obterCategoriaMarcaPorMapa } from '@/lib/brandCategories'
import { obterNomeGrupoErp } from '@/lib/erpGroups'
import { obterDescontoPromocional } from '@/lib/ofertas'

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

const MOJIBAKE_PUBLICO = {
  'Ã¡': 'á',
  'Ã ': 'à',
  'Ã¢': 'â',
  'Ã£': 'ã',
  'Ã©': 'é',
  'Ãª': 'ê',
  'Ã­': 'í',
  'Ã³': 'ó',
  'Ã´': 'ô',
  'Ãµ': 'õ',
  'Ãº': 'ú',
  'Ã§': 'ç',
  'Ã': 'Á',
  'Ã‰': 'É',
  'Ã“': 'Ó',
  'Ãš': 'Ú',
  'Ã‡': 'Ç',
  'Ãƒ': 'Ã',
}

export function corrigirTextoPublico(valor) {
  let texto = String(valor || '')
  for (const [errado, correto] of Object.entries(MOJIBAKE_PUBLICO)) {
    texto = texto.split(errado).join(correto)
  }
  return texto
}

export function normalizarTexto(valor) {
  return corrigirTextoPublico(valor)
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

export const SECOES_CATALOGO = [
  {
    nome: 'Aço e Perfis',
    grupos: [3, 5, 6, 7, 8, 15, 18, 19, 20, 39, 50, 60, 65, 78, 79, 84, 85, 87, 91, 103],
  },
  {
    nome: 'Telhas e Coberturas',
    grupos: [16, 26, 80, 81],
  },
  {
    nome: 'Portas, Janelas e Esquadrias',
    grupos: [38, 98],
  },
  {
    nome: 'Ferragens e Fixação',
    grupos: [2, 11, 22, 27, 28, 32, 40, 41, 46, 47, 49, 64, 67, 68, 70, 71, 74, 105],
  },
  {
    nome: 'Ferramentas Manuais e Agrícolas',
    grupos: [21, 42, 43, 45],
  },
  {
    nome: 'Máquinas e Equipamentos',
    grupos: [10, 17, 24, 35, 36, 44, 58, 92, 93],
  },
  {
    nome: 'Solda, Corte e Abrasivos',
    grupos: [29, 30, 33, 102],
  },
  {
    nome: 'Hidráulica, Elétrica e Iluminação',
    grupos: [23, 37, 51, 55, 57, 59, 100],
  },
  {
    nome: 'Acabamento, Pintura e Químicos',
    grupos: [1, 4, 25, 52, 69, 73, 75, 82, 83],
  },
  {
    nome: 'EPIs, Casa e Utilidades',
    grupos: [9, 12, 13, 14, 31, 34, 48, 53, 54, 56, 61, 62, 63, 66, 72, 76, 77, 86, 88, 89, 90, 94, 95, 96, 97, 99, 101, 104, 9999],
  },
]

const SECAO_PADRAO_CATALOGO = 'EPIs, Casa e Utilidades'
const ORDEM_SECOES_CATALOGO = new Map(SECOES_CATALOGO.map((secao, index) => [corrigirTextoPublico(secao.nome), index]))

export function slugCategoriaCatalogo(nome, { compacto = true } = {}) {
  const base = normalizarTexto(nome)
    .replace(/&/g, ' e ')
    .replace(/[^a-z0-9]+/g, compacto ? '' : '-')
    .replace(/^-+|-+$/g, '')

  return base || ''
}

export function obterCategoriaPorSlugCatalogo(slug) {
  const slugNormalizado = normalizarTexto(slug).replace(/[^a-z0-9-]+/g, '')
  if (!slugNormalizado) return null

  const secao = SECOES_CATALOGO.find((item) => {
    const nome = corrigirTextoPublico(item.nome)
    const slugCompacto = slugCategoriaCatalogo(nome)
    const slugComHifen = slugCategoriaCatalogo(nome, { compacto: false })
    return slugNormalizado === slugCompacto || slugNormalizado === slugComHifen
  })

  return secao ? { ...secao, nome: corrigirTextoPublico(secao.nome) } : null
}

const REGRAS_TEXTO_SECOES = [
  {
    nome: 'Hidráulica, Elétrica e Iluminação',
    termos: [
      'tubo pvc',
      'tubo soldavel',
      'joelho',
      'luva esgoto',
      'luva soldavel',
      'torneira',
      'registro',
      'caixa d agua',
      'valvula',
      'sifao',
      'ralo',
      'adaptador sold',
      'adaptador pvc',
      'conexao',
      'disjuntor',
      'tomada',
      'interruptor',
      'eletroduto',
      'lampada',
      'led',
      'cabo flex',
      'fio flex',
    ],
  },
  {
    nome: 'Ferragens e Fixação',
    termos: [
      'parafuso*',
      'chumbador',
      'prego',
      'porca',
      'arruela',
      'rebite',
      'cadeado',
      'fechadura',
      'dobradica',
      'bucha',
      'grampo',
      'abracadeira',
      'corrente',
      'gancho',
      'gonzo',
      'roldana',
      'rodizio',
      'puxador',
    ],
  },
  {
    nome: 'Solda, Corte e Abrasivos',
    termos: [
      'disco corte',
      'disco flap',
      'disco desbaste',
      'disco diamantado',
      'eletrodo',
      'solda',
      'abrasivo',
      'desbaste',
      'arame mig',
      'mascara de solda',
    ],
  },
  {
    nome: 'Ferramentas Manuais e Agrícolas',
    termos: [
      'alicate',
      'chave',
      'martelo',
      'marreta',
      'trena',
      'nivel',
      'ancinho',
      'enxada',
      'desempenadeira',
      'colher p pedreiro',
      'pa quadrada',
      'pa de bico',
      'alavanca',
    ],
  },
  {
    nome: 'Máquinas e Equipamentos',
    termos: [
      'furadeira*',
      'parafusadeira*',
      'esmerilhadeira*',
      'serra*',
      'broca*',
      'martelete',
      'betoneira',
      'compactador',
      'lixadeira',
      'compressor',
      'lavadora',
      'maquina',
      'motor',
      'bomba',
    ],
  },
  {
    nome: 'Acabamento, Pintura e Químicos',
    termos: [
      'argamassa',
      'rejunte',
      'cimento',
      'tinta',
      'spray tinta',
      'selador',
      'verniz',
      'thinner',
      'solvente',
      'silicone',
      'espuma expansiva',
      'impermeabilizante',
      'adesivo',
      'cola',
      'vedante',
      'resina',
      'lubrificante',
    ],
  },
  {
    nome: 'Portas, Janelas e Esquadrias',
    termos: [
      'janela',
      'porta abrir',
      'porta laminada',
      'porta veneziana',
      'basculh*',
      'basculante',
      'postigo',
      'veneziana',
      'esquadria',
      'grade corrente',
      'grade quadriculada',
    ],
  },
  {
    nome: 'Telhas e Coberturas',
    termos: [
      'telha',
      'cumeeira',
      'rufo',
      'calha',
      'galvalume',
      'fibrocimento',
      'policarbonato',
      'lona azul',
      'eternit',
      'cobertura',
      'forro pvc',
    ],
  },
  {
    nome: 'Aço e Perfis',
    termos: [
      'metalon',
      'vergalhao',
      'cantoneira',
      'perfil u',
      'perfil c',
      'barra chata',
      'tela soldada',
      'malha pop',
      'trelica',
      'arame farpado',
      'arame galv',
      'arame liso',
      'chapa',
      'tubo industrial',
      'aco',
      'ferro',
    ],
  },
  {
    nome: 'EPIs, Casa e Utilidades',
    termos: [
      'bota',
      'luva de',
      'capacete',
      'oculos',
      'epi',
      'mascara',
      'balde',
      'vassoura',
      'mangueira jardim',
      'jardim',
      'churrasqueira',
      'escada',
      'caixa plastica',
      'fogao camping',
      'bebedouro',
      'barraca',
    ],
  },
]

function obterGrupoProduto(produto) {
  return Number(produto?.grupo || produto?.grupo_id || produto?.id_grupo || 0)
}

function prepararTextoSecao(produto) {
  return normalizarTexto([
    produto?.nome,
    produto?.descricao,
    produto?.marca,
    produto?.grupo_nome,
    produto?.nome_grupo,
    produto?.grupo_descricao,
    produto?.subgrupo_nome,
    produto?.nome_subgrupo,
    produto?.subgrupo_descricao,
    obterNomeGrupoErp(produto),
    produto?.foto_url,
    produto?.fallback_foto_url,
    produto?.image,
  ].filter(Boolean).join(' '))
}

function inferirSecaoPorTexto(produto) {
  const base = prepararTextoSecao(produto)
  const regra = REGRAS_TEXTO_SECOES.find((secao) =>
    secao.termos.some((termo) => termoCasaCategoria(base, termo))
  )
  return regra?.nome || ''
}

function inferirSecaoPorGrupo(produto) {
  const grupo = obterGrupoProduto(produto)
  if (!grupo) return ''
  return SECOES_CATALOGO.find((secao) => secao.grupos.includes(grupo))?.nome || ''
}

export function inferirCategoriaProduto(produto) {
  return corrigirTextoPublico(inferirSecaoPorTexto(produto) || inferirSecaoPorGrupo(produto) || SECAO_PADRAO_CATALOGO)
}

export function inferirGrupoCatalogo(produto) {
  const grupo = obterGrupoProduto(produto)
  const nome = obterNomeGrupoErp(produto) || 'Outros produtos'
  return {
    id: grupo ? String(grupo) : normalizarTexto(nome),
    nome,
  }
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
    .sort((a, b) => {
      const ordemA = ORDEM_SECOES_CATALOGO.get(a.nome) ?? 999
      const ordemB = ORDEM_SECOES_CATALOGO.get(b.nome) ?? 999
      return ordemA - ordemB || b.quantidade - a.quantidade || a.nome.localeCompare(b.nome, 'pt-BR')
    })
}

export function montarGruposPorSecaoCatalogo(produtos, secaoAtiva) {
  const mapa = new Map()

  for (const produto of produtos || []) {
    if (secaoAtiva && inferirCategoriaProduto(produto) !== secaoAtiva) continue

    const grupo = inferirGrupoCatalogo(produto)
    if (!grupo.id) continue

    const atual = mapa.get(grupo.id) || {
      id: grupo.id,
      nome: grupo.nome,
      quantidade: 0,
      score: 0,
    }

    atual.quantidade += 1
    atual.score += calcularScoreCatalogo(produto)
    mapa.set(grupo.id, atual)
  }

  return Array.from(mapa.values()).sort(
    (a, b) => b.quantidade - a.quantidade || b.score - a.score || a.nome.localeCompare(b.nome, 'pt-BR')
  )
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

const CAMPOS_POPULARIDADE_CATALOGO = [
  { campos: ['score_catalogo', 'score_site', 'ranking_site', 'popularidade'], peso: 1 },
  { campos: ['cliques_30d', 'clicks_30d', 'cliques', 'clicks'], peso: 18 },
  { campos: ['visualizacoes_30d', 'views_30d', 'visualizacoes', 'views', 'acessos'], peso: 9 },
  { campos: ['orcamentos_30d', 'quote_count_30d', 'orcamentos', 'quote_count'], peso: 28 },
  { campos: ['vendas_90d', 'vendas_3m', 'quantidade_vendida_3m', 'quantidade_vendida'], peso: 34 },
  { campos: ['faturamento_90d', 'faturamento_3m', 'receita_90d'], peso: 0.08 },
]

const TERMOS_FORTE_INTENCAO_COMPRA = [
  { termo: 'telha', pontos: 42 },
  { termo: 'metalon', pontos: 38 },
  { termo: 'parafuso', pontos: 36 },
  { termo: 'disco corte', pontos: 34 },
  { termo: 'broca', pontos: 30 },
  { termo: 'argamassa', pontos: 30 },
  { termo: 'cimento', pontos: 28 },
  { termo: 'vergalhao', pontos: 28 },
  { termo: 'tela soldada', pontos: 26 },
  { termo: 'cantoneira', pontos: 24 },
  { termo: 'perfil', pontos: 24 },
  { termo: 'tubo pvc', pontos: 24 },
  { termo: 'chapa', pontos: 22 },
  { termo: 'tinta', pontos: 20 },
  { termo: 'eletrodo', pontos: 20 },
  { termo: 'fechadura', pontos: 18 },
  { termo: 'cadeado', pontos: 18 },
  { termo: 'bota', pontos: 16 },
  { termo: 'luva', pontos: 14 },
]

const BONUS_SECAO_CATALOGO = {
  'Ferragens e Fixação': 34,
  'Solda, Corte e Abrasivos': 34,
  'Ferramentas Manuais e Agrícolas': 32,
  'Máquinas e Equipamentos': 31,
  'Aço e Perfis': 30,
  'Telhas e Coberturas': 30,
  'Portas, Janelas e Esquadrias': 24,
  'Hidráulica, Elétrica e Iluminação': 22,
  'Acabamento, Pintura e Químicos': 20,
  'EPIs, Casa e Utilidades': 10,
}

function numeroProduto(produto, campos = []) {
  for (const campo of campos) {
    const valor = Number(produto?.[campo] || 0)
    if (Number.isFinite(valor) && valor > 0) return valor
  }
  return 0
}

function possuiFotoCatalogo(produto) {
  return Boolean(produto?.fallback_foto_url || produto?.foto_url || produto?.image)
}

function calcularScorePopularidadeHistorica(produto) {
  return CAMPOS_POPULARIDADE_CATALOGO.reduce((total, regra) => {
    const valor = numeroProduto(produto, regra.campos)
    if (valor <= 0) return total

    return total + Math.log1p(valor) * regra.peso
  }, 0)
}

function calcularScoreFaixaPreco(preco) {
  if (preco <= 0) return -250
  if (preco < 5) return 8
  if (preco < 20) return 22
  if (preco < 80) return 36
  if (preco < 300) return 44
  if (preco < 1200) return 38
  if (preco < 4000) return 26
  return 14
}

function calcularScoreTermosVenda(produto) {
  const base = prepararTextoSecao(produto)
  return TERMOS_FORTE_INTENCAO_COMPRA.reduce(
    (total, item) => total + (termoCasaCategoria(base, item.termo) ? item.pontos : 0),
    0
  )
}

export function calcularScoreCatalogo(produto) {
  const preco = Number(produto?.preco || 0)
  const estoque = Number(produto?.estoque || 0)
  const temEstoque = estoque > 0
  const temFoto = possuiFotoCatalogo(produto)
  const marca = String(produto?.marca || '').trim().toUpperCase()
  const secao = inferirCategoriaProduto(produto)
  const desconto = obterDescontoPromocional(produto)

  return (
    calcularScorePopularidadeHistorica(produto) +
    calcularScoreTermosVenda(produto) +
    calcularScoreFaixaPreco(preco) +
    (BONUS_SECAO_CATALOGO[secao] || 0) +
    (temEstoque ? 120 : -180) +
    (temFoto ? 70 : -90) +
    (preco > 0 ? 60 : -200) +
    (marca && marca !== 'GERAL' ? 12 : 0) +
    Math.min(90, Math.log1p(Math.max(0, estoque)) * 18) +
    Math.min(40, Number(desconto || 0) * 1.8)
  )
}

export function calcularScoreComercial(produto) {
  return calcularScoreCatalogo(produto)
}

const ROTACAO_CATALOGO_PADRAO_MS = 1000 * 60 * 60 * 6

function obterBlocoRotacaoCatalogo() {
  return Math.floor(Date.now() / ROTACAO_CATALOGO_PADRAO_MS)
}

function hashRotacaoProduto(produto, seed = obterBlocoRotacaoCatalogo()) {
  const base = `${produto?.id || ''}:${obterGrupoProduto(produto)}:${produto?.subgrupo || ''}:${seed}`
  let hash = 2166136261

  for (let index = 0; index < base.length; index += 1) {
    hash ^= base.charCodeAt(index)
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)
  }

  return (hash >>> 0) / 4294967295
}

function diversificarCatalogoPadrao(items = [], limiteInicial = 120) {
  const selecionados = []
  const grupos = new Map()
  const secoes = new Map()
  const limites = [
    { maxGrupo: 4, maxSecao: 18 },
    { maxGrupo: 8, maxSecao: 32 },
    { maxGrupo: 9999, maxSecao: 9999 },
  ]

  for (const limite of limites) {
    for (const item of items) {
      if (selecionados.length >= limiteInicial) break
      const produto = item.produto
      const id = Number(produto?.id || 0)
      if (!id || selecionados.some((selecionado) => Number(selecionado?.id || 0) === id)) continue

      const grupo = inferirGrupoCatalogo(produto).id || `produto-${id}`
      const secao = inferirCategoriaProduto(produto)
      const totalGrupo = grupos.get(grupo) || 0
      const totalSecao = secoes.get(secao) || 0

      if (totalGrupo >= limite.maxGrupo || totalSecao >= limite.maxSecao) continue

      selecionados.push(produto)
      grupos.set(grupo, totalGrupo + 1)
      secoes.set(secao, totalSecao + 1)
    }
  }

  const usados = new Set(selecionados.map((produto) => Number(produto?.id || 0)))
  const restante = items
    .map((item) => item.produto)
    .filter((produto) => produto?.id && !usados.has(Number(produto.id)))

  return [...selecionados, ...restante]
}

export function ordenarCatalogoPadraoDinamico(produtos = [], { seed = obterBlocoRotacaoCatalogo() } = {}) {
  const items = (produtos || [])
    .filter(Boolean)
    .map((produto) => {
      const scoreComercial = calcularScoreComercial(produto)
      const giro = hashRotacaoProduto(produto, seed)
      const giroSecundario = hashRotacaoProduto(produto, seed + 13)

      return {
        produto,
        score:
          scoreComercial +
          giro * 110 +
          giroSecundario * 35 +
          (Number(produto?.estoque || 0) > 0 ? 25 : 0) +
          (possuiFotoCatalogo(produto) ? 18 : 0),
      }
    })
    .sort((a, b) => b.score - a.score || Number(b.produto?.estoque || 0) - Number(a.produto?.estoque || 0))

  return diversificarCatalogoPadrao(items)
}

export function calcularScoreFerroAco(produto) {
  const nome = normalizarTexto(produto?.nome)
  if (nome.startsWith('perfil')) return 1000000 + calcularScoreCatalogo(produto)
  return calcularScoreCatalogo(produto)
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

  const catalogoPadrao =
    !busca &&
    !marca &&
    !categoriaEspecial &&
    !secaoEspecial &&
    !subgrupoEspecial

  return {
    produtos: catalogoPadrao
      ? ordenarCatalogoPadraoDinamico(produtos)
      : [...produtos].sort((a, b) => calcularScoreComercial(b) - calcularScoreComercial(a)),
    marcasCatalogo: montarMarcasCatalogo(produtos),
    categoriasCatalogo: montarCategoriasCatalogo(produtos),
  }
}
