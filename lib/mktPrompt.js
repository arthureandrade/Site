import path from 'path'
import { readFile } from 'fs/promises'

const DEFAULT_MODEL = process.env.OPENAI_MKT_MODEL || 'gpt-image-1'
const SPEC_PATH = path.join(process.cwd(), 'docs', 'mkt-ad-guidelines.md')

function formatarValor(valor) {
  const numero = Number(String(valor || '').replace(/[^\d,.-]/g, '').replace('.', '').replace(',', '.'))
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

export async function montarPromptMkt({ precoFormatado, nomeArquivo }) {
  const diretriz = await carregarDiretrizMkt()

  return [
    'Voce e diretor de arte senior de varejo visual para a Galpao do Aco.',
    '',
    `Preco oficial do anuncio: ${precoFormatado}.`,
    nomeArquivo ? `Arquivo enviado pelo usuario: ${nomeArquivo}.` : null,
    '',
    'Crie uma arte promocional vertical premium para story/status, baseada fielmente no produto enviado.',
    'A arte deve parecer um anuncio profissional de loja de material de construcao, com composicao forte, contraste alto e foco comercial.',
    'Preserve a aparencia do produto, sem inventar acessorios, sem trocar cor principal e sem duplicar o item.',
    'Use um fundo contextual coerente com o uso do produto e deixe o produto dominante, heroico e central.',
    'Deixe areas livres para o sistema aplicar a logo real e a faixa de preco depois:',
    '- reserve uma zona limpa no canto superior direito para a logo',
    '- reserve uma faixa forte e limpa na parte inferior para a placa de preco',
    '',
    'Pode criar headline curta em portugues, em caixa alta, comercial e impactante.',
    'Nao escreva o preco dentro da arte.',
    'Nao desenhe logo parecida com a da marca.',
    'Nao coloque marcas de agua.',
    'Nao crie colagem baguncada.',
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
