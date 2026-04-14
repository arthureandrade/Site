import { normalizarPrecoMkt, montarPromptMkt, sanitizarTextoCurto, aplicarDescontoMkt } from '@/lib/mktPrompt'
import sharp from 'sharp'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:8000'

function jsonErro(message, status = 400) {
  return Response.json({ error: message }, { status })
}

async function normalizarImagemParaOpenAI(buffer) {
  return sharp(buffer)
    .rotate()
    .resize({
      width: 1536,
      height: 1536,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .png()
    .toBuffer()
}

function montarFotoProdutoUrl(produto) {
  if (!produto?.foto_url) return null
  if (String(produto.foto_url).startsWith('http')) return produto.foto_url
  return `${API_URL}${produto.foto_url}`
}

async function buscarProdutoDoSite(codigoProduto) {
  const response = await fetch(`${API_URL}/produtos/${encodeURIComponent(codigoProduto)}`, {
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error('Nao foi possivel buscar esse codigo no catalogo do site.')
  }

  const produto = await response.json()
  if (!produto?.id) {
    throw new Error('O codigo informado nao retornou um produto valido.')
  }

  return produto
}

export async function POST(request) {
  if (!process.env.OPENAI_API_KEY) {
    return jsonErro('OPENAI_API_KEY nao configurada no servidor.', 500)
  }

  try {
    const formData = await request.formData()
    const modo = String(formData.get('mode') || 'manual')
    const imagem = formData.get('image')
    const valor = formData.get('price')
    const codigoInformado = sanitizarTextoCurto(formData.get('productCode'))
    const nomeInformado = sanitizarTextoCurto(formData.get('productName'))
    const descontoInformado = Number(formData.get('discountPercent') || 0)

    let arquivoImagem = imagem
    let precoFonte = valor
    let nomeProduto = nomeInformado
    let codigoProduto = codigoInformado

    if (modo === 'site') {
      if (!codigoProduto) {
        return jsonErro('Informe o codigo do produto para gerar com a imagem do site.')
      }

      const produto = await buscarProdutoDoSite(codigoProduto)
      const fotoUrl = montarFotoProdutoUrl(produto)

      if (!fotoUrl) {
        return jsonErro('Esse produto do site nao tem imagem cadastrada para gerar o anuncio.')
      }

      const respostaFoto = await fetch(fotoUrl, { cache: 'no-store' })
      if (!respostaFoto.ok) {
        return jsonErro('Nao foi possivel baixar a imagem do produto no site.')
      }

      const fotoBuffer = Buffer.from(await respostaFoto.arrayBuffer())
      arquivoImagem = new File([fotoBuffer], `${produto.id}.jpg`, {
        type: respostaFoto.headers.get('content-type') || 'image/jpeg',
      })
      precoFonte = aplicarDescontoMkt(produto.preco, descontoInformado)
      nomeProduto = nomeProduto || sanitizarTextoCurto(produto.nome, `Produto ${produto.id}`)
      codigoProduto = String(produto.id)
    }

    if (!arquivoImagem || typeof arquivoImagem === 'string') {
      return jsonErro('Envie uma imagem do produto.')
    }

    if (!arquivoImagem.type?.startsWith('image/')) {
      return jsonErro('O arquivo enviado precisa ser uma imagem valida.')
    }

    const limiteBytes = 15 * 1024 * 1024
    if (arquivoImagem.size > limiteBytes) {
      return jsonErro('A imagem excede o limite de 15 MB.')
    }

    const { precoFormatado, model } = normalizarPrecoMkt(precoFonte)
    const prompt = await montarPromptMkt({
      precoFormatado,
      nomeArquivo: arquivoImagem.name,
      nomeProduto,
      codigoProduto,
    })

    const bufferOriginal = Buffer.from(await arquivoImagem.arrayBuffer())
    const buffer = await normalizarImagemParaOpenAI(bufferOriginal)
    const payload = new FormData()
    payload.append('model', model)
    payload.append('prompt', prompt)
    payload.append('size', '1024x1536')
    payload.append('quality', 'high')
    payload.append('background', 'opaque')
    payload.append('image', new Blob([buffer], { type: 'image/png' }), `${codigoProduto || 'produto'}.png`)

    const resposta = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: payload,
    })

    const data = await resposta.json()

    if (!resposta.ok) {
      return jsonErro(data?.error?.message || 'Falha ao gerar anuncio com a OpenAI.', resposta.status)
    }

    const b64 = data?.data?.[0]?.b64_json
    if (!b64) {
      return jsonErro('A OpenAI nao retornou imagem para este anuncio.', 502)
    }

    return Response.json({
      ok: true,
      imageDataUrl: `data:image/png;base64,${b64}`,
      promptPreview: prompt.slice(0, 1000),
      precoFormatado,
      nomeProduto,
      codigoProduto,
      descontoPercentual: descontoInformado,
      model,
    })
  } catch (error) {
    return jsonErro(error instanceof Error ? error.message : 'Erro inesperado ao gerar anuncio.', 500)
  }
}
