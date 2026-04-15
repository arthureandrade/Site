import { API_URL } from '@/lib/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function jsonErro(message, status = 400) {
  return Response.json({ error: message }, { status })
}

function normalizarNumero(valor) {
  const numero = Number(valor ?? 0)
  return Number.isFinite(numero) ? numero : 0
}

function normalizarTexto(valor) {
  return String(valor || '')
    .replace(/\s+/g, ' ')
    .trim()
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

async function buscarCatalogoCompleto() {
  const response = await fetch(`${API_URL}/produtos?skip=0&limit=15000&todas_secoes=1`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('Nao foi possivel carregar o catalogo para gerar recomendacoes.')
  }

  const data = await response.json()
  return Array.isArray(data?.produtos) ? data.produtos : []
}

function montarCandidatos(produtos) {
  const base = produtos
    .map((item) => {
      const preco = normalizarNumero(item?.preco)
      const estoque = normalizarNumero(item?.estoque)
      const faturamento3m = normalizarNumero(item?.faturamento_3m)
      const qtd3m = normalizarNumero(item?.quantidade_vendida_3m)
      const scoreBase =
        faturamento3m * 0.55 +
        qtd3m * 0.3 +
        Math.min(estoque, 500) * 0.1 +
        Math.min(preco, 5000) * 0.05

      const potencial =
        estoque >= 8 && preco >= 20 && qtd3m <= 8 ? 1 : 0

      return {
        id: normalizarNumero(item?.id),
        nome: normalizarTexto(item?.nome || item?.descricao),
        descricao: normalizarTexto(item?.descricao || item?.nome),
        preco,
        estoque,
        faturamento_3m: faturamento3m,
        quantidade_vendida_3m: qtd3m,
        marca: normalizarTexto(item?.marca),
        secao: normalizarNumero(item?.secao),
        score_base: Number((scoreBase + potencial * 18).toFixed(2)),
        flag_potencial: potencial === 1,
      }
    })
    .filter((item) => item.id > 0 && item.nome && item.preco >= 20 && item.estoque > 0 && item.secao === 5)

  const campeoesVenda = [...base]
    .filter((item) => item.quantidade_vendida_3m > 0 || item.faturamento_3m > 0)
    .sort((a, b) => b.score_base - a.score_base)
    .slice(0, 50)

  const apostas = [...base]
    .filter((item) => item.flag_potencial)
    .sort((a, b) => b.estoque - a.estoque || b.preco - a.preco)
    .slice(0, 20)

  const mapa = new Map()
  for (const item of [...campeoesVenda, ...apostas]) {
    mapa.set(item.id, item)
  }

  return Array.from(mapa.values()).slice(0, 60)
}

export async function POST() {
  if (!process.env.OPENAI_API_KEY) {
    return jsonErro('OPENAI_API_KEY nao configurada no servidor.', 500)
  }

  try {
    const produtos = await buscarCatalogoCompleto()
    const candidatos = montarCandidatos(produtos)

    if (!candidatos.length) {
      return jsonErro('Nao encontrei produtos suficientes para recomendar.', 404)
    }

    const prompt = [
      'Voce e um analista comercial e de marketing da Galpao do Aco.',
      'Sua tarefa e escolher exatamente 10 produtos para postagem do dia.',
      'Use como base vendas dos ultimos 3 meses, preco, estoque e potencial de crescimento.',
      'Prioridades:',
      '- produtos acima de 20 reais',
      '- produtos com bom estoque',
      '- produtos que ja trazem vendas',
      '- misturar itens fortes e alguns itens com potencial de crescer mais',
      '- evitar escolher 10 itens quase iguais',
      '',
      'Retorne somente JSON valido neste formato:',
      '{"produtos":[{"codigo":123,"descricao":"NOME DO PRODUTO","motivo":"frase curta"}]}',
      '',
      'Candidatos:',
      JSON.stringify(candidatos, null, 2),
    ].join('\n')

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5.4-mini',
        input: prompt,
        reasoning: { effort: 'medium' },
        max_output_tokens: 1200,
      }),
    }).catch(() => null)

    if (!response?.ok) {
      const erro = await response?.json().catch(() => null)
      return jsonErro(erro?.error?.message || 'A IA nao conseguiu gerar recomendacoes agora.', response?.status || 502)
    }

    const data = await response.json().catch(() => null)
    const texto = extrairTextoResponses(data)
    let json = null

    try {
      json = JSON.parse(texto)
    } catch {
      const match = texto.match(/\{[\s\S]*\}/)
      if (match) {
        json = JSON.parse(match[0])
      }
    }

    const produtosResposta = Array.isArray(json?.produtos) ? json.produtos : []
    const produtosNormalizados = produtosResposta
      .map((item) => ({
        codigo: normalizarNumero(item?.codigo),
        descricao: normalizarTexto(item?.descricao),
        motivo: normalizarTexto(item?.motivo),
      }))
      .filter((item) => item.codigo > 0 && item.descricao)
      .slice(0, 10)

    if (!produtosNormalizados.length) {
      return jsonErro('A IA nao retornou uma lista valida de 10 produtos para recomendar.', 502)
    }

    return Response.json({
      ok: true,
      produtos: produtosNormalizados,
      origem: 'ia',
    })
  } catch (error) {
    return jsonErro(error instanceof Error ? error.message : 'Erro inesperado ao gerar recomendacoes.', 500)
  }
}
