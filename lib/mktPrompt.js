import path from 'path'
import { readFile } from 'fs/promises'

const DEFAULT_MODEL = process.env.OPENAI_MKT_MODEL || 'gpt-image-1'
const SPEC_PATH = path.join(process.cwd(), 'docs', 'mkt-ad-guidelines.md')

function formatarValor(valor) {
  const texto = String(valor ?? '').trim()
  if (!texto) return null

  const apenasNumeros = texto.replace(/[^\d]/g, '')
  const temSeparadorDecimal = /[.,]\d{1,2}$/.test(texto)
  let numero = 0

  if (temSeparadorDecimal) {
    numero = Number(texto.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, ''))
  } else if (apenasNumeros) {
    numero = Number(apenasNumeros)
  }

  if (!Number.isFinite(numero) || numero <= 0) {
    return null
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numero)
}

export async function carregarDiretrizMkt() {
  return readFile(SPEC_PATH, 'utf8')
}

export async function montarPromptMkt({ precoFormatado, nomeArquivo, nomeProduto, codigoProduto }) {
  const diretriz = await carregarDiretrizMkt()

  return [
    'Voce e diretor de arte senior de varejo visual para a Galpao do Aco.',
    '',
    `Preco oficial do anuncio: ${precoFormatado}.`,
    nomeArquivo ? `Arquivo enviado pelo usuario: ${nomeArquivo}.` : null,
    nomeProduto ? `Nome comercial do produto: ${nomeProduto}.` : null,
    codigoProduto ? `Codigo interno do produto: ${codigoProduto}.` : null,
    '',
    'Crie uma arte promocional vertical premium para story/status, baseada fielmente no produto enviado.',
    'A arte deve parecer um anuncio profissional de loja de material de construcao, com composicao forte, contraste alto e foco comercial.',
    'Preserve a aparencia do produto, sem inventar acessorios, sem trocar cor principal e sem duplicar o item.',
    'Use um fundo contextual coerente com o uso do produto e deixe o produto dominante, heroico e central.',
    'Deixe areas livres para o sistema aplicar a logo real e a faixa de preco depois:',
    '- reserve uma zona limpa no canto superior direito para a logo',
    '- reserve uma faixa inferior visualmente limpa, sem caixa vazia, sem tarja pronta e sem placeholder de preco',
    '',
    'Pode criar headline curta em portugues, em caixa alta, comercial e impactante.',
    'Nao escreva o preco dentro da arte.',
    'Nao desenhe logo parecida com a da marca.',
    'Nao desenhe caixa vermelha, quadro de preco, tarja promocional, retangulo vazio ou selo de valor.',
    'Nao coloque marcas de agua.',
    'Nao crie colagem baguncada.',
    'Nao diminua demais o produto; ele precisa parecer dominante e vender sozinho.',
    '',
    'Siga rigorosamente estas diretrizes de criacao:',
    diretriz,
  ]
    .filter(Boolean)
    .join('\n')
}

export function normalizarPrecoMkt(valor) {
  const precoFormatado = formatarValor(valor)
  if (!precoFormatado) {
    throw new Error('Informe um valor valido para o anuncio.')
  }

  return {
    precoFormatado,
    model: DEFAULT_MODEL,
  }
}

export function aplicarDescontoMkt(valor, descontoPercentual = 0) {
  const texto = String(valor ?? '').trim()
  const apenasNumeros = texto.replace(/[^\d]/g, '')
  const temSeparadorDecimal = /[.,]\d{1,2}$/.test(texto)
  let numeroBase = 0

  if (temSeparadorDecimal) {
    numeroBase = Number(texto.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, ''))
  } else if (apenasNumeros) {
    numeroBase = Number(apenasNumeros)
  }

  if (!Number.isFinite(numeroBase) || numeroBase <= 0) {
    throw new Error('Nao foi possivel calcular o preco do anuncio.')
  }

  const desconto = Number(descontoPercentual || 0)
  const fator = Math.max(0, 1 - desconto / 100)
  return Number((numeroBase * fator).toFixed(2))
}

export function sanitizarTextoCurto(valor, fallback = '') {
  return String(valor || fallback)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 90)
}
