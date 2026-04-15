import { montarPromptCopyMkt, sanitizarTextoCurto } from '@/lib/mktPrompt'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function jsonErro(message, status = 400) {
  return Response.json({ error: message }, { status })
}

function extrairTextoResponses(data) {
  const textoDireto = String(data?.output_text || '').trim()
  if (textoDireto) return textoDireto

  const itens = Array.isArray(data?.output) ? data.output : []
  const partes = []

  for (const item of itens) {
    const conteudos = Array.isArray(item?.content) ? item.content : []
    for (const conteudo of conteudos) {
      if (conteudo?.type === 'output_text' && typeof conteudo?.text === 'string') {
        const texto = conteudo.text.trim()
        if (texto) partes.push(texto)
      }
    }
  }

  return partes.join('\n').trim()
}

export async function POST(request) {
  if (!process.env.OPENAI_API_KEY) {
    return jsonErro('OPENAI_API_KEY nao configurada no servidor.', 500)
  }

  try {
    const body = await request.json().catch(() => null)
    if (!body) {
      return jsonErro('Nao foi possivel ler os dados para gerar a copy.')
    }

    const nomeProduto = sanitizarTextoCurto(body?.nomeProduto, 'Produto')
    const codigoProduto = sanitizarTextoCurto(body?.codigoProduto)
    const precoFormatado = sanitizarTextoCurto(body?.precoFormatado)
    const postFormat = String(body?.postFormat || 'stories').toLowerCase() === 'feed' ? 'feed' : 'stories'

    if (!precoFormatado) {
      return jsonErro('Preco da arte nao informado para gerar a copy.')
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5.4-mini',
        input: montarPromptCopyMkt({
          nomeProduto,
          precoFormatado,
          codigoProduto,
          postFormat,
        }),
        reasoning: { effort: 'low' },
        max_output_tokens: 180,
      }),
    }).catch(() => null)

    if (!response?.ok) {
      const erro = await response?.json().catch(() => null)
      return jsonErro(erro?.error?.message || 'Nao foi possivel gerar a copy agora.', response?.status || 502)
    }

    const data = await response.json().catch(() => null)
    const linhas = extrairTextoResponses(data)
      .split(/\r?\n/)
      .map((linha) => linha.trim())
      .filter(Boolean)

    const texto = (postFormat === 'feed' ? linhas : linhas.slice(0, 3)).join('\n')

    if (!texto) {
      return jsonErro('A IA nao retornou uma copy valida para esta arte.', 502)
    }

    return Response.json({
      ok: true,
      copy: texto,
    })
  } catch (error) {
    return jsonErro(error instanceof Error ? error.message : 'Erro inesperado ao gerar copy.', 500)
  }
}
