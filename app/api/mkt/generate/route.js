import { normalizarPrecoMkt, montarPromptMkt } from '@/lib/mktPrompt'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function jsonErro(message, status = 400) {
  return Response.json({ error: message }, { status })
}

export async function POST(request) {
  if (!process.env.OPENAI_API_KEY) {
    return jsonErro('OPENAI_API_KEY nao configurada no servidor.', 500)
  }

  try {
    const formData = await request.formData()
    const imagem = formData.get('image')
    const valor = formData.get('price')

    if (!imagem || typeof imagem === 'string') {
      return jsonErro('Envie uma imagem do produto.')
    }

    if (!imagem.type?.startsWith('image/')) {
      return jsonErro('O arquivo enviado precisa ser uma imagem valida.')
    }

    const limiteBytes = 15 * 1024 * 1024
    if (imagem.size > limiteBytes) {
      return jsonErro('A imagem excede o limite de 15 MB.')
    }

    const { precoFormatado, model } = normalizarPrecoMkt(valor)
    const prompt = await montarPromptMkt({
      precoFormatado,
      nomeArquivo: imagem.name,
    })

    const buffer = Buffer.from(await imagem.arrayBuffer())
    const payload = new FormData()
    payload.append('model', model)
    payload.append('prompt', prompt)
    payload.append('size', '1024x1536')
    payload.append('quality', 'high')
    payload.append('background', 'opaque')
    payload.append('image', new Blob([buffer], { type: imagem.type }), imagem.name || 'produto.png')

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
      model,
    })
  } catch (error) {
    return jsonErro(error instanceof Error ? error.message : 'Erro inesperado ao gerar anuncio.', 500)
  }
}
