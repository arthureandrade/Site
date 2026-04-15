'use client'

import { useEffect, useMemo, useState } from 'react'

const TELEFONE_PRINCIPAL = '(95) 3224-0115'
const WHATSAPP_COMERCIAL = '(95) 99165-0808'
const ENDERECO_1 = 'Av. Gen. Ataide Teive, 4495 - Asa Branca'
const ENDERECO_2 = 'Av. Gen. Ataide Teive, 5928 - Santa Tereza'
const MKT_RECOMENDACOES_STORAGE_KEY = 'galpao-mkt-recomendacoes-v1'

function lerHistoricoRecomendacoesLocal() {
  if (typeof window === 'undefined') return []

  try {
    const bruto = window.localStorage.getItem(MKT_RECOMENDACOES_STORAGE_KEY)
    const lista = JSON.parse(bruto || '[]')
    return Array.isArray(lista) ? lista : []
  } catch {
    return []
  }
}

function salvarHistoricoRecomendacoesLocal(lista) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(MKT_RECOMENDACOES_STORAGE_KEY, JSON.stringify(lista))
  } catch {}
}

function registrarHistoricoRecomendacoesLocal(produtos) {
  const agora = new Date().toISOString()
  const historicoAtual = lerHistoricoRecomendacoesLocal()
  const novos = (Array.isArray(produtos) ? produtos : [])
    .map((item) => ({
      codigo: String(item?.codigo || '').trim(),
      descricao: String(item?.descricao || '').trim(),
      recomendadoEm: agora,
    }))
    .filter((item) => item.codigo)

  const limiteMs = 1000 * 60 * 60 * 24 * 21
  const base = [...novos, ...historicoAtual].filter((item) => {
    const ts = new Date(item?.recomendadoEm || '').getTime()
    return Number.isFinite(ts) && Date.now() - ts <= limiteMs
  })

  salvarHistoricoRecomendacoesLocal(base.slice(0, 300))
}

function formatarPreco(valor) {
  if (typeof valor === 'number' && Number.isFinite(valor)) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor)
  }

  const texto = String(valor ?? '').trim()
  if (!texto) return ''

  const limpo = texto.replace(/[^\d,.-]/g, '')
  const separadores = [...limpo.matchAll(/[.,]/g)].map((match) => match.index)
  let normalizado = limpo

  if (separadores.length) {
    const ultimoSeparador = separadores[separadores.length - 1]
    const casas = limpo.length - ultimoSeparador - 1

    if (casas >= 1 && casas <= 2) {
      const parteInteira = limpo.slice(0, ultimoSeparador).replace(/[.,]/g, '')
      const parteDecimal = limpo.slice(ultimoSeparador + 1).replace(/[.,]/g, '')
      normalizado = `${parteInteira}.${parteDecimal}`
    } else {
      normalizado = limpo.replace(/[.,]/g, '')
    }
  }

  const numero = Number(normalizado)
  if (!Number.isFinite(numero) || numero <= 0) return ''
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numero)
}

function carregarImagem(src) {
  return new Promise((resolve, reject) => {
    const image = new window.Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

function desenharCover(ctx, image, targetWidth, targetHeight, options = {}) {
  const zoom = options.zoom || 1
  const focalX = options.focalX ?? 0.5
  const focalY = options.focalY ?? 0.5
  const scale = Math.max(targetWidth / image.width, targetHeight / image.height) * zoom
  const width = image.width * scale
  const height = image.height * scale
  const overflowX = width - targetWidth
  const overflowY = height - targetHeight
  const x = -(overflowX * focalX)
  const y = -(overflowY * focalY)
  ctx.drawImage(image, x, y, width, height)
}

function desenharContain(ctx, image, targetX, targetY, targetWidth, targetHeight) {
  const scale = Math.min(targetWidth / image.width, targetHeight / image.height)
  const width = image.width * scale
  const height = image.height * scale
  const x = targetX + (targetWidth - width) / 2
  const y = targetY + (targetHeight - height) / 2
  ctx.drawImage(image, x, y, width, height)
}

function roundedRectPath(ctx, x, y, width, height, radius) {
  ctx.beginPath()
  ctx.roundRect(x, y, width, height, radius)
}

function quebrarPreco(precoTexto) {
  const texto = String(precoTexto || '').replace(/\s+/g, ' ').trim()
  const semMoeda = texto.replace(/^R\$\s*/, '')
  const [inteira, decimal = '00'] = semMoeda.split(',')
  return {
    inteira: inteira || '0',
    decimal,
  }
}

function quebrarTitulo(texto) {
  const partes = String(texto || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (!partes.length) return []
  const linhas = []
  let atual = ''

  for (const parte of partes) {
    const tentativa = atual ? `${atual} ${parte}` : parte
    if (tentativa.length <= 16) {
      atual = tentativa
    } else {
      if (atual) linhas.push(atual)
      atual = parte
    }
  }

  if (atual) linhas.push(atual)
  return linhas.slice(0, 4)
}

function desenharLogoComSombra(ctx, logoImage, x, y, width, height) {
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.34)'
  ctx.shadowBlur = 22
  ctx.shadowOffsetY = 8
  desenharContain(ctx, logoImage, x, y, width, height)
  ctx.restore()
}

function parseRespostaJsonSegura(raw) {
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    return { error: raw }
  }
}

function extrairListaCodigos(texto) {
  return Array.from(
    new Set(
      String(texto || '')
        .split(/[\s,;\n\r\t]+/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  )
}

async function comporAnuncioFinal(
  baseImageSrc,
  precoTexto,
  { nomeProduto, codigoProduto, postFormat = 'stories', withPrice = true } = {},
) {
  const [baseImage, logoImage] = await Promise.all([
    carregarImagem(baseImageSrc),
    carregarImagem(`/logofundo.png?v=${Date.now()}`),
  ])
  const canvas = document.createElement('canvas')
  const isFeed = postFormat === 'feed'
  canvas.width = 1080
  canvas.height = isFeed ? 1350 : 1920

  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  const canvasW = canvas.width
  const canvasH = canvas.height
  const footerHeight = isFeed ? 150 : 220
  const topGradientHeight = isFeed ? 320 : 420
  const bottomOverlayHeight = isFeed ? 480 : 760
  const logoCardX = isFeed ? 690 : 640
  const logoCardY = isFeed ? 26 : 36
  const logoCardW = isFeed ? 300 : 360
  const logoCardH = isFeed ? 154 : 186
  const titleStartY = isFeed ? 236 : 318
  const titleLineHeight = isFeed ? 66 : 78
  const titleFont = isFeed ? 62 : 74
  const precoBoxH = isFeed ? 182 : 220
  const precoBoxY = isFeed ? canvasH - footerHeight - precoBoxH - 34 : 1362
  const precoBaseY = isFeed ? precoBoxY + 132 : 1538
  const headerBadgeY = isFeed ? 58 : 70
  const headerCodeY = isFeed ? 128 : 150
  const footerY = canvasH - footerHeight

  ctx.fillStyle = '#130607'
  ctx.fillRect(0, 0, canvasW, canvasH)

  desenharCover(ctx, baseImage, canvasW, canvasH, {
    zoom: isFeed ? 1.08 : 1.14,
    focalX: 0.5,
    focalY: isFeed ? 0.4 : 0.42,
  })

  const topGradient = ctx.createLinearGradient(0, 0, 0, topGradientHeight)
  topGradient.addColorStop(0, 'rgba(0,0,0,0.84)')
  topGradient.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = topGradient
  ctx.fillRect(0, 0, canvasW, topGradientHeight)

  const vignette = ctx.createRadialGradient(canvasW / 2, canvasH * 0.52, 280, canvasW / 2, canvasH * 0.52, canvasW)
  vignette.addColorStop(0, 'rgba(0,0,0,0)')
  vignette.addColorStop(1, 'rgba(0,0,0,0.34)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, canvasW, canvasH)

  const bottomGradient = ctx.createLinearGradient(0, canvasH - bottomOverlayHeight, 0, canvasH)
  bottomGradient.addColorStop(0, 'rgba(0,0,0,0)')
  bottomGradient.addColorStop(0.3, 'rgba(0,0,0,0.24)')
  bottomGradient.addColorStop(1, 'rgba(22,4,4,0.95)')
  ctx.fillStyle = bottomGradient
  ctx.fillRect(0, canvasH - bottomOverlayHeight, canvasW, bottomOverlayHeight)

  desenharLogoComSombra(ctx, logoImage, logoCardX, logoCardY, logoCardW, logoCardH)

  ctx.save()
  ctx.fillStyle = 'rgba(255,255,255,0.14)'
  roundedRectPath(ctx, 54, headerBadgeY, 296, 64, 20)
  ctx.fill()
  ctx.restore()

  ctx.fillStyle = '#ffffff'
  ctx.font = '700 26px Arial'
  ctx.fillText('OFERTA ESPECIAL', 82, headerBadgeY + 42)

  if (codigoProduto) {
    ctx.save()
      ctx.fillStyle = 'rgba(255,255,255,0.12)'
      roundedRectPath(ctx, 54, headerCodeY, 184, 48, 16)
      ctx.fill()
      ctx.restore()

      ctx.fillStyle = '#ffffff'
      ctx.font = '700 21px Arial'
      ctx.fillText(`COD. ${codigoProduto}`, 76, headerCodeY + 32)
  }

  const linhasTitulo = quebrarTitulo(nomeProduto)
  if (linhasTitulo.length) {
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.38)'
    ctx.shadowBlur = 18
    ctx.fillStyle = '#ffffff'
    ctx.font = `900 ${titleFont}px Arial`
    let y = titleStartY
  for (const linha of linhasTitulo) {
      ctx.fillText(linha.toUpperCase(), 76, y)
      y += titleLineHeight
    }
    ctx.restore()
  }

  if (withPrice && precoTexto) {
    const { inteira, decimal } = quebrarPreco(precoTexto)

    const precoPrefixo = 'R$'
    let fontePreco = isFeed ? 102 : 124
    let fonteDecimal = isFeed ? 54 : 64
    ctx.textBaseline = 'alphabetic'
    ctx.font = `900 ${fontePreco}px Arial`
    let larguraInteira = ctx.measureText(inteira).width
    ctx.font = `900 ${fonteDecimal}px Arial`
    let larguraDecimal = ctx.measureText(`,${decimal}`).width
    ctx.font = `900 ${isFeed ? 70 : 82}px Arial`
    const larguraPrefixo = ctx.measureText(precoPrefixo).width + 18
    ctx.font = `800 ${isFeed ? 36 : 42}px Arial`
    const larguraAvista = ctx.measureText('A VISTA').width
    const larguraMaximaPreco = (isFeed ? 684 : 760) - larguraAvista

    while (larguraPrefixo + larguraInteira + larguraDecimal > larguraMaximaPreco && fontePreco > (isFeed ? 78 : 96)) {
      fontePreco -= 6
      fonteDecimal -= 3
      ctx.font = `900 ${fontePreco}px Arial`
      larguraInteira = ctx.measureText(inteira).width
      ctx.font = `900 ${fonteDecimal}px Arial`
      larguraDecimal = ctx.measureText(`,${decimal}`).width
    }

    const totalPreco = larguraPrefixo + larguraInteira + larguraDecimal
    const blocoTotal = totalPreco + 48 + larguraAvista
    const precoBoxW = Math.min(isFeed ? 930 : 948, Math.max(isFeed ? 620 : 560, blocoTotal + 136))
    const precoBoxX = (canvasW - precoBoxW) / 2
    const precoX = precoBoxX + (precoBoxW - blocoTotal) / 2

    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.28)'
    ctx.shadowBlur = 34
    const precoGradient = ctx.createLinearGradient(precoBoxX, precoBoxY, precoBoxX + precoBoxW, precoBoxY + precoBoxH)
    precoGradient.addColorStop(0, '#980b12')
    precoGradient.addColorStop(0.45, '#d90f18')
    precoGradient.addColorStop(1, '#ff5331')
    ctx.fillStyle = precoGradient
    roundedRectPath(ctx, precoBoxX, precoBoxY, precoBoxW, precoBoxH, 34)
    ctx.fill()
    ctx.restore()

    ctx.save()
    ctx.strokeStyle = 'rgba(255,255,255,0.14)'
    ctx.lineWidth = 2
    roundedRectPath(ctx, precoBoxX, precoBoxY, precoBoxW, precoBoxH, 34)
    ctx.stroke()
    ctx.restore()

    ctx.fillStyle = '#ffffff'
    ctx.font = `700 ${isFeed ? 24 : 28}px Arial`
    ctx.fillText('POR APENAS:', precoBoxX + 34, precoBoxY + 64)

    ctx.font = `900 ${isFeed ? 70 : 82}px Arial`
    ctx.fillText(precoPrefixo, precoX, precoBaseY - (isFeed ? 14 : 18))

    const inteiroX = precoX + larguraPrefixo
    ctx.font = `900 ${fontePreco}px Arial`
    ctx.fillText(inteira, inteiroX, precoBaseY)

    const decimalX = inteiroX + larguraInteira + 8
    ctx.font = `900 ${fonteDecimal}px Arial`
    ctx.fillText(`,${decimal}`, decimalX, precoBaseY - (isFeed ? 16 : 20))

    ctx.font = `800 ${isFeed ? 36 : 42}px Arial`
    const avista = 'A VISTA'
    ctx.fillText(avista, decimalX + larguraDecimal + 48, precoBaseY - (isFeed ? 4 : 8))
  }

  const footerGradient = ctx.createLinearGradient(0, footerY, canvasW, canvasH)
  footerGradient.addColorStop(0, '#6f0910')
  footerGradient.addColorStop(1, '#310306')
  ctx.fillStyle = footerGradient
  ctx.fillRect(0, footerY, canvasW, footerHeight)

  ctx.save()
  ctx.fillStyle = 'rgba(255,255,255,0.06)'
  const phoneCardY = footerY + (isFeed ? 20 : 32)
  const phoneCardH = isFeed ? 62 : 82
  roundedRectPath(ctx, 56, phoneCardY, 430, phoneCardH, 26)
  ctx.fill()
  roundedRectPath(ctx, 594, phoneCardY, 430, phoneCardH, 26)
  ctx.fill()
  ctx.restore()

  ctx.fillStyle = '#ffffff'
  ctx.font = `800 ${isFeed ? 30 : 36}px Arial`
  ctx.fillText(WHATSAPP_COMERCIAL, 86, phoneCardY + (isFeed ? 40 : 54))
  ctx.fillText(TELEFONE_PRINCIPAL, 626, phoneCardY + (isFeed ? 40 : 54))

  ctx.font = `700 ${isFeed ? 14 : 17}px Arial`
  const infoBaseY = footerY + (isFeed ? 100 : 156)
  ctx.fillText('LOJA MATRIZ', 74, infoBaseY)
  ctx.fillText('LOJA FILIAL', 74, infoBaseY + (isFeed ? 28 : 34))

  ctx.font = `600 ${isFeed ? 15 : 18}px Arial`
  ctx.fillText(ENDERECO_1, 204, infoBaseY)
  ctx.fillText(ENDERECO_2, 204, infoBaseY + (isFeed ? 28 : 34))

  return canvas.toDataURL('image/png')
}

export default function MktAdStudio() {
  const [modo, setModo] = useState('manual')
  const [postFormat, setPostFormat] = useState('stories')
  const [priceMode, setPriceMode] = useState('with-price')
  const [arquivo, setArquivo] = useState(null)
  const [previewProduto, setPreviewProduto] = useState('')
  const [valor, setValor] = useState('')
  const [nomeProduto, setNomeProduto] = useState('')
  const [codigoProduto, setCodigoProduto] = useState('')
  const [descontoSite, setDescontoSite] = useState('0')
  const [gerando, setGerando] = useState(false)
  const [erro, setErro] = useState('')
  const [resultado, setResultado] = useState('')
  const [resultados, setResultados] = useState({ stories: '', feed: '' })
  const [arteBase, setArteBase] = useState('')
  const [copyTexto, setCopyTexto] = useState('')
  const [detalhes, setDetalhes] = useState(null)
  const [gerandoCopy, setGerandoCopy] = useState(false)
  const [codigosLote, setCodigosLote] = useState('')
  const [gerandoLote, setGerandoLote] = useState(false)
  const [progressoLote, setProgressoLote] = useState({ atual: 0, total: 0 })
  const [resultadosLote, setResultadosLote] = useState([])
  const [gerandoRecomendacoes, setGerandoRecomendacoes] = useState(false)
  const [recomendacoesDia, setRecomendacoesDia] = useState([])
  const [origemRecomendacoes, setOrigemRecomendacoes] = useState('')

  useEffect(() => {
    return () => {
      if (previewProduto?.startsWith('blob:')) {
        URL.revokeObjectURL(previewProduto)
      }
    }
  }, [previewProduto])

  const valorFormatado = useMemo(() => formatarPreco(valor), [valor])

  async function handleSubmit(event) {
    event.preventDefault()
    setErro('')

    if (modo === 'manual' && !arquivo) {
      setErro('Envie uma imagem do produto para gerar o anuncio.')
      return
    }

    if (modo === 'manual' && priceMode === 'with-price' && !valorFormatado) {
      setErro('Informe um valor valido para a oferta.')
      return
    }

    if (modo === 'site' && !codigoProduto.trim()) {
      setErro('Informe o codigo do produto do site.')
      return
    }

    setGerando(true)
    setResultado('')
    setResultados({ stories: '', feed: '' })
    setArteBase('')
    setCopyTexto('')
    setResultadosLote([])

    try {
      const formData = new FormData()
      formData.append('mode', modo)
      if (arquivo) formData.append('image', arquivo)
      if (valor) formData.append('price', valor)
      if (codigoProduto) formData.append('productCode', codigoProduto)
      if (nomeProduto) formData.append('productName', nomeProduto)
      if (modo === 'site') formData.append('discountPercent', descontoSite)
      formData.append('postFormat', postFormat)
      formData.append('priceMode', priceMode)

      const response = await fetch('/api/mkt/generate', {
        method: 'POST',
        body: formData,
      })

      const raw = await response.text()
      const data = parseRespostaJsonSegura(raw)
      if (!response.ok) {
        throw new Error(data?.error || 'Nao foi possivel gerar o anuncio.')
      }

      setArteBase(data.imageDataUrl)
      setDetalhes({
        model: data.model,
        preco: data.precoFormatado,
        nomeProduto: data.nomeProduto || nomeProduto,
        codigoProduto: data.codigoProduto || codigoProduto,
        descontoPercentual: data.descontoPercentual || 0,
        postFormat: data.postFormat || postFormat,
        withPrice: data.withPrice !== false,
      })

      const nomeFinal = data.nomeProduto || nomeProduto
      const codigoFinal = data.codigoProduto || codigoProduto
      const formatoFinal = data.postFormat || postFormat

      if (formatoFinal === 'both') {
        const [storiesDataUrl, feedDataUrl] = await Promise.all([
          comporAnuncioFinal(data.imageDataUrl, data.precoFormatado, {
            nomeProduto: nomeFinal,
            codigoProduto: codigoFinal,
            postFormat: 'stories',
            withPrice: data.withPrice !== false,
          }),
          comporAnuncioFinal(data.imageDataUrl, data.precoFormatado, {
            nomeProduto: nomeFinal,
            codigoProduto: codigoFinal,
            postFormat: 'feed',
            withPrice: data.withPrice !== false,
          }),
        ])

        setResultados({
          stories: storiesDataUrl,
          feed: feedDataUrl,
        })
        setResultado(storiesDataUrl)
      } else {
        const finalDataUrl = await comporAnuncioFinal(data.imageDataUrl, data.precoFormatado, {
          nomeProduto: nomeFinal,
          codigoProduto: codigoFinal,
          postFormat: formatoFinal,
          withPrice: data.withPrice !== false,
        })
        setResultados({
          stories: formatoFinal === 'stories' ? finalDataUrl : '',
          feed: formatoFinal === 'feed' ? finalDataUrl : '',
        })
        setResultado(finalDataUrl)
      }
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Falha inesperada ao gerar anuncio.')
      setDetalhes(null)
    } finally {
      setGerando(false)
    }
  }

  async function handleGerarCopy() {
    if (!detalhes?.preco || !resultado) return

    setGerandoCopy(true)
    setErro('')

    try {
      const response = await fetch('/api/mkt/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomeProduto: detalhes?.nomeProduto || nomeProduto,
          codigoProduto: detalhes?.codigoProduto || codigoProduto,
          precoFormatado: detalhes?.preco,
          postFormat:
            (detalhes?.postFormat || postFormat) === 'both'
              ? 'feed'
              : (detalhes?.postFormat || postFormat),
        }),
      })

      const raw = await response.text()
      const data = parseRespostaJsonSegura(raw)
      if (!response.ok) {
        throw new Error(data?.error || 'Nao foi possivel gerar a copy.')
      }

      setCopyTexto(data.copy || '')
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Falha ao gerar a copy.')
    } finally {
      setGerandoCopy(false)
    }
  }

  async function gerarAnuncioPorCodigo(codigo) {
    const formData = new FormData()
    formData.append('mode', 'site')
    formData.append('productCode', codigo)
    if (nomeProduto) formData.append('productName', nomeProduto)
    formData.append('discountPercent', descontoSite)
    formData.append('postFormat', postFormat)
    formData.append('priceMode', priceMode)

    const response = await fetch('/api/mkt/generate', {
      method: 'POST',
      body: formData,
    })

    const raw = await response.text()
    const data = parseRespostaJsonSegura(raw)
    if (!response.ok) {
      throw new Error(data?.error || `Nao foi possivel gerar o anuncio do codigo ${codigo}.`)
    }

    const nomeFinal = data.nomeProduto || nomeProduto || `Produto ${codigo}`
    const codigoFinal = data.codigoProduto || codigo
    const formatoFinal = data.postFormat || postFormat
    let imagens = { stories: '', feed: '' }

    if (formatoFinal === 'both') {
      const [storiesDataUrl, feedDataUrl] = await Promise.all([
        comporAnuncioFinal(data.imageDataUrl, data.precoFormatado, {
          nomeProduto: nomeFinal,
          codigoProduto: codigoFinal,
          postFormat: 'stories',
          withPrice: data.withPrice !== false,
        }),
        comporAnuncioFinal(data.imageDataUrl, data.precoFormatado, {
          nomeProduto: nomeFinal,
          codigoProduto: codigoFinal,
          postFormat: 'feed',
          withPrice: data.withPrice !== false,
        }),
      ])
      imagens = { stories: storiesDataUrl, feed: feedDataUrl }
    } else {
      const finalDataUrl = await comporAnuncioFinal(data.imageDataUrl, data.precoFormatado, {
        nomeProduto: nomeFinal,
        codigoProduto: codigoFinal,
        postFormat: formatoFinal,
        withPrice: data.withPrice !== false,
      })
      imagens = {
        stories: formatoFinal === 'stories' ? finalDataUrl : '',
        feed: formatoFinal === 'feed' ? finalDataUrl : '',
      }
    }

    return {
      codigo: codigoFinal,
      nomeProduto: nomeFinal,
      preco: data.precoFormatado,
      imagens,
    }
  }

  async function handleGerarLote() {
    const listaCodigos = extrairListaCodigos(codigosLote)
    if (!listaCodigos.length) {
      setErro('Informe pelo menos um codigo para gerar em lote.')
      return
    }

    setErro('')
    setGerandoLote(true)
    setResultadosLote([])
    setProgressoLote({ atual: 0, total: listaCodigos.length })

    const acumulados = []

    try {
      for (let index = 0; index < listaCodigos.length; index += 1) {
        const codigo = listaCodigos[index]
        const item = await gerarAnuncioPorCodigo(codigo)
        acumulados.push(item)
        setResultadosLote([...acumulados])
        setProgressoLote({ atual: index + 1, total: listaCodigos.length })
      }
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Falha ao gerar o lote de anuncios.')
    } finally {
      setGerandoLote(false)
    }
  }

  async function handleGerarRecomendacoes() {
    setGerandoRecomendacoes(true)
    setErro('')

    try {
      const historico = lerHistoricoRecomendacoesLocal()
      const response = await fetch('/api/mkt/recomendacoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          historicoRecomendacoes: historico,
        }),
      })

      const raw = await response.text()
      const data = parseRespostaJsonSegura(raw)
      if (!response.ok) {
        throw new Error(data?.error || 'Nao foi possivel gerar as recomendacoes de postagem.')
      }

      const produtos = Array.isArray(data?.produtos) ? data.produtos : []
      setRecomendacoesDia(produtos)
      setOrigemRecomendacoes(String(data?.origem || ''))
      registrarHistoricoRecomendacoesLocal(produtos)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Falha ao gerar as recomendacoes.')
    } finally {
      setGerandoRecomendacoes(false)
    }
  }

  function usarRecomendacoesNoLote() {
    if (!recomendacoesDia.length) return
    setCodigosLote(recomendacoesDia.map((item) => item.codigo).join('\n'))
  }

  function handleFileChange(event) {
    const nextFile = event.target.files?.[0]
    if (!nextFile) return

    if (previewProduto?.startsWith('blob:')) {
      URL.revokeObjectURL(previewProduto)
    }

    setArquivo(nextFile)
    setPreviewProduto(URL.createObjectURL(nextFile))
    setResultado('')
    setArteBase('')
    setErro('')
  }

  function baixarImagem() {
    if (!resultado) return
    const link = document.createElement('a')
    link.href = resultado
    link.download = `anuncio-galpao-do-aco-${Date.now()}.png`
    link.click()
  }

  function baixarImagemPorFormato(formato) {
    const url = resultados?.[formato]
    if (!url) return
    const link = document.createElement('a')
    link.href = url
    link.download = `anuncio-galpao-do-aco-${formato}-${Date.now()}.png`
    link.click()
  }

  function baixarResultadoLote(item, formato) {
    const url = item?.imagens?.[formato]
    if (!url) return
    const link = document.createElement('a')
    link.href = url
    link.download = `anuncio-galpao-do-aco-${item.codigo}-${formato}.png`
    link.click()
  }

  async function baixarLoteCompleto() {
    for (const item of resultadosLote) {
      const formatos = postFormat === 'both' ? ['stories', 'feed'] : [postFormat]
      for (const formato of formatos) {
        const url = item?.imagens?.[formato]
        if (!url) continue
        const link = document.createElement('a')
        link.href = url
        link.download = `anuncio-galpao-do-aco-${item.codigo}-${formato}.png`
        link.click()
        await new Promise((resolve) => window.setTimeout(resolve, 180))
      }
    }
  }

  const possuiResultado = Boolean(resultado)
  const exibindoAmbos = postFormat === 'both' && (resultados.stories || resultados.feed)
  const quantidadeCodigosLote = extrairListaCodigos(codigosLote).length

  return (
    <div className="bg-[radial-gradient(circle_at_top,#3b0000_0%,#140606_42%,#090909_100%)]">
      <div className="mx-auto flex w-full max-w-[1720px] flex-col gap-8 px-4 py-8 sm:px-6 xl:px-10">
        <section className="overflow-hidden rounded-[36px] border border-red-400/30 bg-white/95 shadow-[0_35px_100px_rgba(127,29,29,0.35)]">
          <div className="grid gap-0 lg:grid-cols-[0.72fr_1.28fr]">
            <div className="bg-[linear-gradient(135deg,#7f0000_0%,#d10921_50%,#ff6b1a_100%)] px-6 py-8 text-white sm:px-8">
              <p className="text-[11px] font-black uppercase tracking-[0.34em] text-white/70">Painel MKT</p>
              <h1 className="mt-3 text-3xl font-black uppercase leading-tight sm:text-5xl">
                Gere anuncios prontos para stories e feed
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/88 sm:text-base">
                Envie a foto do produto, informe o valor e deixe o painel montar uma arte promocional inspirada no estilo comercial da Galpao do Aco.
              </p>
              <div className="mt-8 grid gap-3 text-sm font-semibold sm:grid-cols-2">
                <div className="rounded-[24px] border border-white/15 bg-black/15 px-4 py-4">
                  Produto em destaque heroico
                </div>
                <div className="rounded-[24px] border border-white/15 bg-black/15 px-4 py-4">
                  Faixa de preco exata aplicada pelo site
                </div>
                <div className="rounded-[24px] border border-white/15 bg-black/15 px-4 py-4">
                  Logo real da loja inserida na composicao
                </div>
                <div className="rounded-[24px] border border-white/15 bg-black/15 px-4 py-4">
                  Arte vertical pronta para publicar
                </div>
              </div>
            </div>

            <div className="bg-white px-6 py-8 sm:px-8">
              <form onSubmit={handleSubmit} className="grid gap-6">
                <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
                  <label className="block rounded-[30px] border border-dashed border-red-300 bg-[linear-gradient(180deg,#fff5f5_0%,#ffffff_100%)] p-5">
                    <span className="text-[11px] font-black uppercase tracking-[0.28em] text-red-700">Imagem do produto</span>
                    <div className="mt-4 flex min-h-[220px] items-center justify-center overflow-hidden rounded-[24px] bg-slate-100">
                      {previewProduto ? (
                        <img src={previewProduto} alt="Preview do produto" className="h-full max-h-[320px] w-full object-contain p-4" />
                      ) : (
                        <div className="max-w-sm px-6 text-center text-sm font-semibold text-slate-500">
                          {modo === 'manual'
                            ? 'Arraste ou selecione uma foto do produto em boa qualidade.'
                            : 'No modo site, a imagem sera puxada automaticamente pelo codigo do produto.'}
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="mt-4 block w-full text-sm"
                      disabled={modo !== 'manual'}
                    />
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2 xl:sticky xl:top-6 xl:self-start">
                    <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:col-span-2">
                      <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">Modo de geracao</p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => setModo('manual')}
                          className={`rounded-[20px] px-4 py-4 text-left text-sm font-black uppercase tracking-[0.14em] transition ${
                            modo === 'manual'
                              ? 'bg-red-600 text-white shadow-[0_16px_34px_rgba(185,28,28,0.28)]'
                              : 'border border-slate-200 bg-white text-slate-700'
                          }`}
                        >
                          Upload manual
                        </button>
                        <button
                          type="button"
                          onClick={() => setModo('site')}
                          className={`rounded-[20px] px-4 py-4 text-left text-sm font-black uppercase tracking-[0.14em] transition ${
                            modo === 'site'
                              ? 'bg-red-600 text-white shadow-[0_16px_34px_rgba(185,28,28,0.28)]'
                              : 'border border-slate-200 bg-white text-slate-700'
                          }`}
                        >
                          Gerar com imagem do site
                        </button>
                      </div>
                    </div>

                    <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:col-span-2">
                      <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">Formato da postagem</p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <button
                          type="button"
                          onClick={() => setPostFormat('stories')}
                          className={`rounded-[20px] px-4 py-4 text-left text-sm font-black uppercase tracking-[0.14em] transition ${
                            postFormat === 'stories'
                              ? 'bg-slate-950 text-white shadow-[0_16px_34px_rgba(15,23,42,0.24)]'
                              : 'border border-slate-200 bg-white text-slate-700'
                          }`}
                        >
                          Post para stories
                        </button>
                        <button
                          type="button"
                          onClick={() => setPostFormat('feed')}
                          className={`rounded-[20px] px-4 py-4 text-left text-sm font-black uppercase tracking-[0.14em] transition ${
                            postFormat === 'feed'
                              ? 'bg-slate-950 text-white shadow-[0_16px_34px_rgba(15,23,42,0.24)]'
                              : 'border border-slate-200 bg-white text-slate-700'
                          }`}
                        >
                          Post para feed
                        </button>
                        <button
                          type="button"
                          onClick={() => setPostFormat('both')}
                          className={`rounded-[20px] px-4 py-4 text-left text-sm font-black uppercase tracking-[0.14em] transition ${
                            postFormat === 'both'
                              ? 'bg-slate-950 text-white shadow-[0_16px_34px_rgba(15,23,42,0.24)]'
                              : 'border border-slate-200 bg-white text-slate-700'
                          }`}
                        >
                          Gerar ambos
                        </button>
                      </div>
                      <p className="mt-3 max-w-xl text-sm text-slate-500">
                        {postFormat === 'feed'
                          ? 'Arte mais compacta, pensada para feed vertical 4:5.'
                          : postFormat === 'both'
                            ? 'O painel vai montar duas versoes finais: uma para stories e outra para feed.'
                            : 'Arte alta e impactante, pensada para status e stories.'}
                      </p>
                    </div>

                    <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:col-span-2">
                      <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">Exibicao do preco</p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => setPriceMode('with-price')}
                          className={`rounded-[20px] px-4 py-4 text-left text-sm font-black uppercase tracking-[0.14em] transition ${
                            priceMode === 'with-price'
                              ? 'bg-red-600 text-white shadow-[0_16px_34px_rgba(185,28,28,0.28)]'
                              : 'border border-slate-200 bg-white text-slate-700'
                          }`}
                        >
                          Com preco
                        </button>
                        <button
                          type="button"
                          onClick={() => setPriceMode('without-price')}
                          className={`rounded-[20px] px-4 py-4 text-left text-sm font-black uppercase tracking-[0.14em] transition ${
                            priceMode === 'without-price'
                              ? 'bg-red-600 text-white shadow-[0_16px_34px_rgba(185,28,28,0.28)]'
                              : 'border border-slate-200 bg-white text-slate-700'
                          }`}
                        >
                          Sem preco
                        </button>
                      </div>
                      <p className="mt-3 max-w-xl text-sm text-slate-500">
                        {priceMode === 'without-price'
                          ? 'A arte sai sem a caixa vermelha de valor.'
                          : 'A arte sai com a placa vermelha de preco.'}
                      </p>
                    </div>

                    <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:col-span-2">
                      <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">Informacoes do produto</p>
                      <div className="mt-4 grid gap-3">
                        <input
                          type="text"
                          value={codigoProduto}
                          onChange={(event) => setCodigoProduto(event.target.value)}
                          placeholder={modo === 'site' ? 'Codigo do produto no site' : 'Codigo para aparecer no anuncio'}
                          className="w-full rounded-[18px] border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-red-500"
                        />
                        <input
                          type="text"
                          value={nomeProduto}
                          onChange={(event) => setNomeProduto(event.target.value)}
                          placeholder={modo === 'site' ? 'Opcional: nome manual para sobrepor' : 'Nome do produto para headline'}
                          className="w-full rounded-[18px] border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-red-500"
                          disabled={modo === 'site' && !codigoProduto.trim() ? false : false}
                        />
                      </div>
                    </div>

                    <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:col-span-2">
                      <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">Valor da oferta</p>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={valor}
                        onChange={(event) => setValor(event.target.value)}
                        placeholder={modo === 'site' ? 'No modo site, o preco vem do catalogo' : 'Ex: 4450,50'}
                        className="mt-4 w-full rounded-[20px] border border-slate-200 px-4 py-4 text-2xl font-black text-slate-950 outline-none focus:border-red-500 disabled:bg-slate-100 disabled:text-slate-400"
                        disabled={modo === 'site'}
                      />
                      <p className="mt-3 max-w-xl text-sm text-slate-500">
                        {priceMode === 'without-price'
                          ? 'Neste modo, a arte sera gerada sem exibir valor.'
                          : modo === 'site'
                          ? 'Neste modo, o sistema usa o valor cadastrado no produto do site.'
                          : 'Preco final aplicado na placa vermelha do anuncio.'}
                      </p>
                      {priceMode === 'with-price' && valorFormatado ? (
                        <div className="mt-4 rounded-[20px] bg-red-50 px-4 py-4">
                          <div className="text-[11px] font-black uppercase tracking-[0.24em] text-red-600">Pre-visualizacao</div>
                          <div className="mt-2 text-3xl font-black text-red-700">{valorFormatado}</div>
                        </div>
                      ) : null}
                    </div>

                    {modo === 'site' ? (
                      <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:col-span-2">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">Sugestao inteligente do dia</p>
                            <h3 className="mt-2 text-lg font-black uppercase text-slate-950">10 produtos para postar hoje</h3>
                          </div>
                          {origemRecomendacoes ? (
                            <div className="rounded-[16px] bg-red-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-red-600">
                              Curadoria IA
                            </div>
                          ) : null}
                        </div>

                        <p className="mt-3 max-w-2xl text-sm text-slate-500">
                          Analisa vendas dos ultimos 3 meses, estoque, preco acima de R$ 20 e potencial comercial para sugerir o que vale postar.
                        </p>

                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={handleGerarRecomendacoes}
                            disabled={gerandoRecomendacoes}
                            className="inline-flex items-center justify-center rounded-[18px] bg-red-600 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {gerandoRecomendacoes ? 'Analisando...' : 'Gerar 10 sugestoes'}
                          </button>
                          {recomendacoesDia.length ? (
                            <button
                              type="button"
                              onClick={usarRecomendacoesNoLote}
                              className="inline-flex items-center justify-center rounded-[18px] border border-slate-300 bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-800"
                            >
                              Jogar no lote
                            </button>
                          ) : null}
                        </div>

                        {recomendacoesDia.length ? (
                          <div className="mt-5 rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                            <div className="grid gap-3 lg:grid-cols-2">
                              {recomendacoesDia.map((item, index) => (
                                <div key={`${item.codigo}-${index}`} className="rounded-[18px] bg-white px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
                                  <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Codigo {item.codigo}</div>
                                  <div className="mt-1 text-sm font-black uppercase text-slate-950">{item.descricao}</div>
                                  {item.motivo ? <div className="mt-1 text-xs font-semibold text-slate-500">{item.motivo}</div> : null}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {modo === 'site' ? (
                      <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:col-span-2">
                        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">Desconto no anuncio</p>
                        <select
                          value={descontoSite}
                          onChange={(event) => setDescontoSite(event.target.value)}
                          className="mt-4 w-full rounded-[18px] border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-red-500"
                        >
                          {[0, 5, 8, 10, 12, 15, 18, 20].map((item) => (
                            <option key={item} value={String(item)}>
                              {item}% de desconto
                            </option>
                          ))}
                        </select>
                        <p className="mt-3 max-w-xl text-sm text-slate-500">
                          O preco do site sera reduzido por esse percentual antes de entrar na arte.
                        </p>
                      </div>
                    ) : null}

                    {modo === 'site' ? (
                      <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">Geracao em lote</p>
                        <textarea
                          value={codigosLote}
                          onChange={(event) => setCodigosLote(event.target.value)}
                          placeholder="Cole varios codigos aqui, separados por virgula, espaco ou quebra de linha"
                          className="mt-4 min-h-[140px] w-full rounded-[18px] border border-slate-200 px-4 py-4 text-sm font-semibold text-slate-900 outline-none focus:border-red-500"
                        />
                        <p className="mt-3 max-w-xl text-sm text-slate-500">
                          {quantidadeCodigosLote
                            ? `${quantidadeCodigosLote} codigo(s) identificado(s) para gerar em bloco.`
                            : 'Use esse campo quando quiser gerar varios anuncios de uma vez a partir dos codigos do site.'}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={handleGerarLote}
                            disabled={gerandoLote}
                            className="inline-flex items-center justify-center rounded-[18px] bg-slate-950 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {gerandoLote ? 'Gerando lote...' : 'Gerar lote'}
                          </button>
                          {resultadosLote.length ? (
                            <button
                              type="button"
                              onClick={baixarLoteCompleto}
                              className="inline-flex items-center justify-center rounded-[18px] border border-slate-300 bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-800"
                            >
                              Baixar lote
                            </button>
                          ) : null}
                        </div>
                        {gerandoLote ? (
                          <div className="mt-4 rounded-[18px] bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                            Gerando {progressoLote.atual}/{progressoLote.total}...
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="rounded-[30px] border border-slate-200 bg-slate-950 p-5 text-white shadow-[0_20px_60px_rgba(15,23,42,0.2)] sm:col-span-2">
                      <p className="text-[11px] font-black uppercase tracking-[0.28em] text-white/55">Saida do anuncio</p>
                      <div className="mt-4 space-y-3 text-sm text-white/82">
                        <p>- formato vertical pensado para a publicacao escolhida</p>
                        <p>- logo oficial da loja aplicada automaticamente</p>
                        <p>{priceMode === 'without-price' ? '- arte limpa sem bloco de preco' : '- preco exato em destaque forte'}</p>
                        <p>- visual promocional inspirado nas referencias enviadas</p>
                        <p>- headline com nome e codigo do produto</p>
                        <p>
                          - formato atual:{' '}
                          {postFormat === 'feed'
                            ? 'feed 4:5'
                            : postFormat === 'both'
                              ? 'stories + feed'
                              : 'stories/status'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {erro ? <div className="rounded-[24px] bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">{erro}</div> : null}

                <div className="flex flex-wrap items-center gap-3 rounded-[26px] border border-slate-200 bg-slate-50 px-4 py-4 shadow-[0_16px_36px_rgba(15,23,42,0.06)]">
                  <button
                    type="submit"
                    disabled={gerando}
                    className="inline-flex items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,#b30018_0%,#ff2d20_100%)] px-7 py-4 text-sm font-black uppercase tracking-[0.18em] text-white shadow-[0_24px_50px_rgba(185,28,28,0.35)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {gerando ? 'Gerando anuncio...' : 'Gerar anuncio'}
                  </button>

                    {possuiResultado && !exibindoAmbos ? (
                      <button
                        type="button"
                        onClick={baixarImagem}
                        className="inline-flex items-center justify-center rounded-[22px] border border-slate-300 bg-white px-7 py-4 text-sm font-black uppercase tracking-[0.18em] text-slate-800"
                      >
                        Baixar PNG
                      </button>
                    ) : null}

                    {exibindoAmbos ? (
                      <>
                        <button
                          type="button"
                          onClick={() => baixarImagemPorFormato('stories')}
                          className="inline-flex items-center justify-center rounded-[22px] border border-slate-300 bg-white px-7 py-4 text-sm font-black uppercase tracking-[0.18em] text-slate-800"
                        >
                          Baixar stories
                        </button>
                        <button
                          type="button"
                          onClick={() => baixarImagemPorFormato('feed')}
                          className="inline-flex items-center justify-center rounded-[22px] border border-slate-300 bg-white px-7 py-4 text-sm font-black uppercase tracking-[0.18em] text-slate-800"
                        >
                          Baixar feed
                        </button>
                      </>
                    ) : null}

                    {possuiResultado ? (
                      <button
                        type="button"
                        onClick={handleGerarCopy}
                        disabled={gerandoCopy}
                        className="inline-flex items-center justify-center rounded-[22px] border border-slate-300 bg-white px-7 py-4 text-sm font-black uppercase tracking-[0.18em] text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {gerandoCopy ? 'Gerando copy...' : 'Gerar copy'}
                      </button>
                    ) : null}

                    {copyTexto ? (
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(copyTexto)}
                        className="inline-flex items-center justify-center rounded-[22px] border border-slate-300 bg-white px-7 py-4 text-sm font-black uppercase tracking-[0.18em] text-slate-800"
                      >
                        Copiar copy
                      </button>
                    ) : null}
                </div>
              </form>
            </div>
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[34px] border border-white/10 bg-white/95 p-6 shadow-[0_28px_70px_rgba(15,23,42,0.16)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">Arte final</p>
                <h2 className="mt-2 text-2xl font-black uppercase text-slate-950">Preview para postagem</h2>
              </div>
              {detalhes ? (
                <div className="rounded-[20px] bg-red-50 px-4 py-3 text-right">
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-red-600">{detalhes.model}</div>
                  <div className="mt-1 text-lg font-black text-red-700">{detalhes.preco}</div>
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex min-h-[720px] items-center justify-center rounded-[28px] bg-[linear-gradient(180deg,#140606_0%,#2a0a0a_100%)] p-5">
              {exibindoAmbos ? (
                <div className="grid w-full gap-5 xl:grid-cols-2">
                  {resultados.stories ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="text-[11px] font-black uppercase tracking-[0.24em] text-white/60">Stories</div>
                      <img src={resultados.stories} alt="Anuncio stories gerado" className="max-h-[960px] w-auto rounded-[26px] shadow-[0_25px_80px_rgba(0,0,0,0.45)]" />
                    </div>
                  ) : null}
                  {resultados.feed ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="text-[11px] font-black uppercase tracking-[0.24em] text-white/60">Feed</div>
                      <img src={resultados.feed} alt="Anuncio feed gerado" className="max-h-[960px] w-auto rounded-[26px] shadow-[0_25px_80px_rgba(0,0,0,0.45)]" />
                    </div>
                  ) : null}
                </div>
              ) : resultado ? (
                <img src={resultado} alt="Anuncio gerado" className="max-h-[1120px] w-auto rounded-[26px] shadow-[0_25px_80px_rgba(0,0,0,0.45)]" />
              ) : (
                <div className="max-w-md text-center text-sm font-semibold leading-relaxed text-white/70">
                  A arte final vai aparecer aqui depois da geracao. O sistema aplica a placa de preco e a logo oficial automaticamente.
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-6">
            {resultadosLote.length ? (
              <div className="rounded-[34px] border border-white/10 bg-white/95 p-6 shadow-[0_28px_70px_rgba(15,23,42,0.16)]">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">Lote gerado</p>
                    <h2 className="mt-2 text-2xl font-black uppercase text-slate-950">Anuncios em bloco para baixar</h2>
                  </div>
                  <div className="rounded-[20px] bg-red-50 px-4 py-3 text-right">
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-red-600">Total pronto</div>
                    <div className="mt-1 text-lg font-black text-red-700">{resultadosLote.length} anuncio(s)</div>
                  </div>
                </div>

                <div className="mt-6 grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
                  {resultadosLote.map((item) => (
                    <div key={item.codigo} className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_20px_40px_rgba(15,23,42,0.08)]">
                      <div className="mb-3">
                        <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Cod. {item.codigo}</div>
                        <div className="mt-1 text-base font-black uppercase text-slate-950">{item.nomeProduto}</div>
                        <div className="mt-1 text-sm font-bold text-red-700">{item.preco}</div>
                      </div>

                      <div className="grid gap-4">
                        {item.imagens.stories ? (
                          <div className="rounded-[20px] bg-[linear-gradient(180deg,#140606_0%,#2a0a0a_100%)] p-3">
                            <div className="mb-2 text-[11px] font-black uppercase tracking-[0.22em] text-white/60">Stories</div>
                            <img src={item.imagens.stories} alt={`Stories ${item.codigo}`} className="w-full rounded-[18px]" />
                            <button
                              type="button"
                              onClick={() => baixarResultadoLote(item, 'stories')}
                              className="mt-3 inline-flex w-full items-center justify-center rounded-[16px] border border-white/15 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-800"
                            >
                              Baixar stories
                            </button>
                          </div>
                        ) : null}

                        {item.imagens.feed ? (
                          <div className="rounded-[20px] bg-[linear-gradient(180deg,#140606_0%,#2a0a0a_100%)] p-3">
                            <div className="mb-2 text-[11px] font-black uppercase tracking-[0.22em] text-white/60">Feed</div>
                            <img src={item.imagens.feed} alt={`Feed ${item.codigo}`} className="w-full rounded-[18px]" />
                            <button
                              type="button"
                              onClick={() => baixarResultadoLote(item, 'feed')}
                              className="mt-3 inline-flex w-full items-center justify-center rounded-[16px] border border-white/15 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-800"
                            >
                              Baixar feed
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="rounded-[34px] border border-white/10 bg-white/95 p-6 shadow-[0_28px_70px_rgba(15,23,42,0.16)]">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">Copy para postagem</p>
              <h2 className="mt-2 text-2xl font-black uppercase text-slate-950">
                {postFormat === 'feed' ? 'Legenda comercial para o feed' : 'Legenda curta para acompanhar a arte'}
              </h2>
              <div className="mt-5 rounded-[26px] border border-slate-200 bg-[linear-gradient(180deg,#fff5f5_0%,#ffffff_100%)] p-5">
                {copyTexto ? (
                  <pre className="whitespace-pre-wrap font-sans text-base font-semibold leading-8 text-slate-800">
                    {copyTexto}
                  </pre>
                ) : (
                  <div className="text-sm font-semibold leading-relaxed text-slate-500">
                    {postFormat === 'feed'
                      ? 'Depois que a arte ficar pronta, clique em Gerar copy para montar aqui uma legenda completa no padrao comercial do feed.'
                      : 'Depois que a arte ficar pronta, clique em Gerar copy para montar aqui uma legenda curta de 3 linhas.'}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[34px] border border-white/10 bg-white/95 p-6 shadow-[0_28px_70px_rgba(15,23,42,0.16)]">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">Base criativa</p>
              <h2 className="mt-2 text-2xl font-black uppercase text-slate-950">Como o anuncio e montado</h2>
              <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">Fundo contextual coerente com o produto</div>
                <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">Produto em escala heroica e com mais volume visual</div>
                <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">Headlines curtas e promocionais</div>
                <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                  Acabamento pensado para {postFormat === 'feed' ? 'feed 4:5' : postFormat === 'both' ? 'stories e feed' : 'status e stories'}
                </div>
              </div>
            </div>

            <div className="rounded-[34px] border border-red-300/40 bg-[linear-gradient(135deg,#2b0000_0%,#65070d_45%,#b80f1d_100%)] p-6 text-white shadow-[0_28px_70px_rgba(127,29,29,0.26)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.28em] text-white/60">Direcao comercial</p>
                  <h2 className="mt-2 text-2xl font-black uppercase">Padrao visual do painel MKT</h2>
                </div>
                <img src="/logofundo.png" alt="Logo Galpao do Aco" className="h-14 w-auto shrink-0 drop-shadow-[0_10px_16px_rgba(0,0,0,0.22)]" />
              </div>
              <div className="mt-5 space-y-3 text-sm leading-relaxed text-white/85">
                <p>- visual forte, industrial e vendedor</p>
                <p>- foco quase total no produto e no preco</p>
                <p>- identidade da Galpao do Aco clara e chamativa</p>
                <p>- pronta para publicacao imediata no WhatsApp e Instagram</p>
                {modo === 'site' ? <p>- desconto aplicado no preco do site: {descontoSite}%</p> : null}
              </div>

              {arteBase ? (
                <div className="mt-6 rounded-[24px] border border-white/10 bg-black/20 p-4">
                  <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/55">Render base da OpenAI</div>
                  <img src={arteBase} alt="Arte base gerada pela IA" className="mt-3 w-full rounded-[18px]" />
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
