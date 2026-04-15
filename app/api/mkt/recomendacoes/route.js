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

function limparTextoRecomendacao(texto) {
  return normalizarTexto(
    String(texto || '')
      .replace(/^[-*•\d.\)\s]+/, '')
      .replace(/^codigo[:\s-]*/i, '')
      .replace(/^cod[:.\s-]*/i, ''),
  )
}

function extrairRecomendacoesTextoLivre(texto) {
  const linhas = String(texto || '')
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter(Boolean)

  const itens = []

  for (const linha of linhas) {
    const match = linha.match(/(?:cod(?:igo)?[:.\s-]*)?(\d{1,6})\s*[-–:|]\s*(.+)$/i)
    if (match) {
      itens.push({
        codigo: normalizarNumero(match[1]),
        descricao: limparTextoRecomendacao(match[2]),
        motivo: '',
      })
      continue
    }

    const matchCodigoInicio = linha.match(/^(\d{1,6})\s+(.+)$/)
    if (matchCodigoInicio) {
      itens.push({
        codigo: normalizarNumero(matchCodigoInicio[1]),
        descricao: limparTextoRecomendacao(matchCodigoInicio[2]),
        motivo: '',
      })
    }
  }

  const unicos = new Map()
  for (const item of itens) {
    if (item.codigo > 0 && item.descricao && !unicos.has(item.codigo)) {
      unicos.set(item.codigo, item)
    }
  }

  return Array.from(unicos.values())
}

function normalizarProdutosResposta(itens, candidatosPorCodigo) {
  const lista = Array.isArray(itens) ? itens : []
  const unicos = new Map()

  for (const item of lista) {
    const codigo = normalizarNumero(item?.codigo)
    const candidato = candidatosPorCodigo.get(codigo)
    if (!codigo || !candidato || unicos.has(codigo)) continue

    unicos.set(codigo, {
      codigo,
      descricao: normalizarTexto(item?.descricao) || candidato.descricao || candidato.nome,
      motivo: normalizarTexto(item?.motivo),
    })
  }

  return Array.from(unicos.values())
}

async function chamarOpenAIJson(prompt, maxOutputTokens = 1600) {
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
      max_output_tokens: maxOutputTokens,
    }),
  }).catch(() => null)

  if (!response?.ok) {
    const erro = await response?.json().catch(() => null)
    throw new Error(erro?.error?.message || 'A IA nao conseguiu gerar recomendacoes agora.')
  }

  const data = await response.json().catch(() => null)
  return extrairTextoResponses(data)
}

function tentarExtrairJson(texto) {
  if (!texto) return null

  try {
    return JSON.parse(texto)
  } catch {}

  const match = texto.match(/\{[\s\S]*\}/)
  if (match) {
    try {
      return JSON.parse(match[0])
    } catch {}
  }

  return null
}

function normalizarHistoricoRecomendacoes(lista) {
  const itens = Array.isArray(lista) ? lista : []

  return itens
    .map((item) => ({
      codigo: normalizarNumero(item?.codigo),
      recomendadoEm: String(item?.recomendadoEm || ''),
    }))
    .filter((item) => item.codigo > 0 && item.recomendadoEm)
}

function montarMapaHistorico(historico) {
  const agora = Date.now()
  const mapa = new Map()

  for (const item of historico) {
    const ts = new Date(item.recomendadoEm).getTime()
    if (!Number.isFinite(ts)) continue

    const horas = (agora - ts) / (1000 * 60 * 60)
    if (horas < 0 || horas > 24 * 21) continue

    const atual = mapa.get(item.codigo) || {
      repeticoes3d: 0,
      repeticoes7d: 0,
      repeticoes14d: 0,
      horasDesdeUltima: null,
    }

    if (horas <= 24 * 3) atual.repeticoes3d += 1
    if (horas <= 24 * 7) atual.repeticoes7d += 1
    if (horas <= 24 * 14) atual.repeticoes14d += 1
    if (atual.horasDesdeUltima == null || horas < atual.horasDesdeUltima) {
      atual.horasDesdeUltima = horas
    }

    mapa.set(item.codigo, atual)
  }

  return mapa
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

function montarCandidatos(produtos, historicoMap = new Map()) {
  const base = produtos
    .map((item) => {
      const preco = normalizarNumero(item?.preco)
      const estoque = normalizarNumero(item?.estoque)
      const faturamento3m = normalizarNumero(item?.faturamento_3m)
      const qtd3m = normalizarNumero(item?.quantidade_vendida_3m)
      const historico = historicoMap.get(normalizarNumero(item?.id)) || {
        repeticoes3d: 0,
        repeticoes7d: 0,
        repeticoes14d: 0,
        horasDesdeUltima: null,
      }
      const horasDesdeUltima = historico.horasDesdeUltima ?? 9999
      const cooldownCurtoAtivo = horasDesdeUltima < 48
      const cooldownMedioAtivo = horasDesdeUltima < 96
      const penalidadeVariacao =
        historico.repeticoes3d * 28 +
        historico.repeticoes7d * 14 +
        historico.repeticoes14d * 6 +
        (cooldownCurtoAtivo ? 20 : 0) +
        (cooldownMedioAtivo ? 10 : 0)
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
        score_ajustado: Number((scoreBase + potencial * 18 - penalidadeVariacao).toFixed(2)),
        flag_potencial: potencial === 1,
        repeticoes_3d: historico.repeticoes3d,
        repeticoes_7d: historico.repeticoes7d,
        repeticoes_14d: historico.repeticoes14d,
        horas_desde_ultima_recomendacao:
          horasDesdeUltima === 9999 ? null : Number(horasDesdeUltima.toFixed(1)),
        cooldown_curto_ativo: cooldownCurtoAtivo,
        cooldown_medio_ativo: cooldownMedioAtivo,
      }
    })
    .filter((item) => item.id > 0 && item.nome && item.preco >= 20 && item.estoque > 0 && item.secao === 5)

  const campeoesVenda = [...base]
    .filter((item) => item.quantidade_vendida_3m > 0 || item.faturamento_3m > 0)
    .sort((a, b) => b.score_ajustado - a.score_ajustado || b.score_base - a.score_base)
    .slice(0, 120)

  const apostas = [...base]
    .filter((item) => item.flag_potencial)
    .sort((a, b) => b.score_ajustado - a.score_ajustado || b.estoque - a.estoque || b.preco - a.preco)
    .slice(0, 80)

  const reforcoGeral = [...base]
    .sort((a, b) => b.score_ajustado - a.score_ajustado || b.score_base - a.score_base || b.estoque - a.estoque)
    .slice(0, 200)

  const mapa = new Map()
  for (const item of [...campeoesVenda, ...apostas, ...reforcoGeral]) {
    mapa.set(item.id, item)
  }

  return Array.from(mapa.values()).slice(0, 220)
}

export async function POST(request) {
  if (!process.env.OPENAI_API_KEY) {
    return jsonErro('OPENAI_API_KEY nao configurada no servidor.', 500)
  }

  try {
    const body = await request.json().catch(() => null)
    const historicoRecebido = normalizarHistoricoRecomendacoes(body?.historicoRecomendacoes)
    const historicoMap = montarMapaHistorico(historicoRecebido)
    const produtos = await buscarCatalogoCompleto()
    const candidatos = montarCandidatos(produtos, historicoMap)
    const candidatosPorCodigo = new Map(candidatos.map((item) => [item.id, item]))

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
      '- nao escolha itens da secao 6 ou fora da secao 5',
      '- variar a lista usando o historico recente de recomendacoes',
      '- evitar repetir item recomendado nas ultimas 48 horas, salvo se ele for realmente muito forte',
      '- evitar insistir nos mesmos itens varias vezes na mesma semana',
      '- ainda assim, nao deixe os itens obvios e fortes de fora so por variedade',
      '',
      'Retorne somente JSON valido, sem markdown, sem texto antes ou depois, neste formato:',
      '{"produtos":[{"codigo":123,"descricao":"NOME DO PRODUTO","motivo":"frase curta"}]}',
      'A resposta precisa conter exatamente 10 itens em "produtos".',
      '',
      'Candidatos:',
      JSON.stringify(candidatos, null, 2),
    ].join('\n')

    const texto = await chamarOpenAIJson(prompt, 1400)
    const json = tentarExtrairJson(texto)

    let produtosNormalizados = normalizarProdutosResposta(json?.produtos, candidatosPorCodigo)

    if (!produtosNormalizados.length) {
      produtosNormalizados = normalizarProdutosResposta(
        extrairRecomendacoesTextoLivre(texto),
        candidatosPorCodigo,
      )
    }

    if (produtosNormalizados.length !== 10) {
      const repararPrompt = [
        'Voce vai corrigir uma recomendacao comercial que veio incompleta.',
        'Use apenas os produtos da lista de candidatos abaixo.',
        'Retorne somente JSON valido, sem markdown, sem comentarios, neste formato:',
        '{"produtos":[{"codigo":123,"descricao":"NOME DO PRODUTO","motivo":"frase curta"}]}',
        'A resposta precisa conter exatamente 10 itens unicos.',
        'Todos os codigos precisam existir na lista de candidatos.',
        '',
        'Resposta anterior da IA:',
        texto || '(vazio)',
        '',
        'Candidatos validos:',
        JSON.stringify(candidatos, null, 2),
      ].join('\n')

      const textoReparado = await chamarOpenAIJson(repararPrompt, 1800)
      const jsonReparado = tentarExtrairJson(textoReparado)

      produtosNormalizados = normalizarProdutosResposta(jsonReparado?.produtos, candidatosPorCodigo)

      if (produtosNormalizados.length !== 10) {
        produtosNormalizados = normalizarProdutosResposta(
          extrairRecomendacoesTextoLivre(textoReparado),
          candidatosPorCodigo,
        )
      }
    }

    if (produtosNormalizados.length !== 10) {
      return jsonErro('A IA nao retornou uma lista valida com 10 produtos para recomendar.', 502)
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
