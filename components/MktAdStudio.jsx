'use client'

import { useEffect, useMemo, useState } from 'react'

const TELEFONE_PRINCIPAL = '(95) 3224-0115'
const WHATSAPP_COMERCIAL = '(95) 99165-0808'
const ENDERECO_1 = 'Av. Gen. Ataide Teive, 4495 - Asa Branca'
const ENDERECO_2 = 'Av. Gen. Ataide Teive, 5928 - Santa Tereza'

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

async function comporAnuncioFinal(baseImageSrc, precoTexto, { nomeProduto, codigoProduto } = {}) {
  const [baseImage, logoImage] = await Promise.all([
    carregarImagem(baseImageSrc),
    carregarImagem(`/logofundo.png?v=${Date.now()}`),
  ])
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1920

  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  ctx.fillStyle = '#130607'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  desenharCover(ctx, baseImage, canvas.width, canvas.height, {
    zoom: 1.14,
    focalX: 0.5,
    focalY: 0.42,
  })

  const topGradient = ctx.createLinearGradient(0, 0, 0, 420)
  topGradient.addColorStop(0, 'rgba(0,0,0,0.84)')
  topGradient.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = topGradient
  ctx.fillRect(0, 0, canvas.width, 420)

  const vignette = ctx.createRadialGradient(540, 980, 280, 540, 980, 1080)
  vignette.addColorStop(0, 'rgba(0,0,0,0)')
  vignette.addColorStop(1, 'rgba(0,0,0,0.34)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const bottomGradient = ctx.createLinearGradient(0, canvas.height - 760, 0, canvas.height)
  bottomGradient.addColorStop(0, 'rgba(0,0,0,0)')
  bottomGradient.addColorStop(0.3, 'rgba(0,0,0,0.24)')
  bottomGradient.addColorStop(1, 'rgba(22,4,4,0.95)')
  ctx.fillStyle = bottomGradient
  ctx.fillRect(0, canvas.height - 760, canvas.width, 760)

  const logoCardX = 598
  const logoCardY = 46
  const logoCardW = 300
  const logoCardH = 124

  desenharContain(ctx, logoImage, logoCardX, logoCardY, logoCardW, logoCardH)

  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.22)'
  ctx.shadowBlur = 20
  ctx.fillStyle = 'rgba(255,255,255,0.12)'
  ctx.beginPath()
  ctx.roundRect(54, 70, 330, 76, 20)
  ctx.fill()
  ctx.restore()

  ctx.fillStyle = '#ffffff'
  ctx.font = '700 28px Arial'
  ctx.fillText('OFERTA ESPECIAL', 86, 118)

  if (codigoProduto) {
    ctx.save()
    ctx.fillStyle = 'rgba(255,255,255,0.14)'
    ctx.beginPath()
    ctx.roundRect(54, 160, 206, 54, 18)
    ctx.fill()
    ctx.restore()

    ctx.fillStyle = '#ffffff'
    ctx.font = '700 24px Arial'
    ctx.fillText(`COD. ${codigoProduto}`, 82, 196)
  }

  const linhasTitulo = quebrarTitulo(nomeProduto)
  if (linhasTitulo.length) {
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.38)'
    ctx.shadowBlur = 18
    ctx.fillStyle = '#ffffff'
  ctx.font = '900 74px Arial'
  let y = 318
  for (const linha of linhasTitulo) {
      ctx.fillText(linha.toUpperCase(), 76, y)
      y += 78
    }
    ctx.restore()
  }

  const { inteira, decimal } = quebrarPreco(precoTexto)

  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.34)'
  ctx.shadowBlur = 30
  const precoGradient = ctx.createLinearGradient(42, 0, 1038, 0)
  precoGradient.addColorStop(0, '#b80713')
  precoGradient.addColorStop(0.55, '#eb0c16')
  precoGradient.addColorStop(1, '#ff4021')
  ctx.fillStyle = precoGradient
  ctx.beginPath()
  ctx.roundRect(42, 1380, 996, 260, 30)
  ctx.fill()
  ctx.restore()

  ctx.strokeStyle = 'rgba(255,255,255,0.18)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(42, 1380, 996, 260, 30)
  ctx.stroke()

  ctx.fillStyle = '#ffffff'
  ctx.font = '700 30px Arial'
  ctx.fillText('POR APENAS:', 84, 1454)

  const precoPrefixo = 'R$'
  let fontePreco = 124
  let fonteDecimal = 64
  ctx.textBaseline = 'alphabetic'
  ctx.font = `900 ${fontePreco}px Arial`
  let larguraInteira = ctx.measureText(inteira).width
  ctx.font = `900 ${fonteDecimal}px Arial`
  let larguraDecimal = ctx.measureText(`,${decimal}`).width
  const larguraPrefixo = 104
  const larguraMaximaPreco = 700

  while (larguraPrefixo + larguraInteira + larguraDecimal > larguraMaximaPreco && fontePreco > 96) {
    fontePreco -= 6
    fonteDecimal -= 3
    ctx.font = `900 ${fontePreco}px Arial`
    larguraInteira = ctx.measureText(inteira).width
    ctx.font = `900 ${fonteDecimal}px Arial`
    larguraDecimal = ctx.measureText(`,${decimal}`).width
  }

  const precoX = 84
  const precoBaseY = 1578

  ctx.font = '900 86px Arial'
  ctx.fillText(precoPrefixo, precoX, precoBaseY - 18)

  const inteiroX = precoX + larguraPrefixo
  ctx.font = `900 ${fontePreco}px Arial`
  ctx.fillText(inteira, inteiroX, precoBaseY)

  const decimalX = inteiroX + larguraInteira + 8
  ctx.font = `900 ${fonteDecimal}px Arial`
  ctx.fillText(`,${decimal}`, decimalX, precoBaseY - 20)

  ctx.font = '800 44px Arial'
  const avista = 'A VISTA'
  const avistaWidth = ctx.measureText(avista).width
  ctx.fillText(avista, 1038 - avistaWidth - 36, precoBaseY - 6)

  ctx.save()
  const footerGradient = ctx.createLinearGradient(0, 1688, 1080, 1920)
  footerGradient.addColorStop(0, '#8f0d15')
  footerGradient.addColorStop(1, '#5a0409')
  ctx.fillStyle = footerGradient
  ctx.beginPath()
  ctx.roundRect(0, 1702, 1080, 218, 0)
  ctx.fill()
  ctx.restore()

  ctx.fillStyle = '#ffffff'
  ctx.font = '700 40px Arial'
  ctx.fillText(WHATSAPP_COMERCIAL, 72, 1782)
  ctx.fillText(TELEFONE_PRINCIPAL, 628, 1782)

  ctx.font = '700 20px Arial'
  ctx.fillText('LOJA MATRIZ', 72, 1838)
  ctx.fillText('LOJA FILIAL', 72, 1882)

  ctx.font = '600 22px Arial'
  ctx.fillText(ENDERECO_1, 218, 1838)
  ctx.fillText(ENDERECO_2, 218, 1882)

  return canvas.toDataURL('image/png')
}

export default function MktAdStudio() {
  const [modo, setModo] = useState('manual')
  const [arquivo, setArquivo] = useState(null)
  const [previewProduto, setPreviewProduto] = useState('')
  const [valor, setValor] = useState('')
  const [nomeProduto, setNomeProduto] = useState('')
  const [codigoProduto, setCodigoProduto] = useState('')
  const [descontoSite, setDescontoSite] = useState('0')
  const [gerando, setGerando] = useState(false)
  const [erro, setErro] = useState('')
  const [resultado, setResultado] = useState('')
  const [arteBase, setArteBase] = useState('')
  const [detalhes, setDetalhes] = useState(null)

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

    if (modo === 'manual' && !valorFormatado) {
      setErro('Informe um valor valido para a oferta.')
      return
    }

    if (modo === 'site' && !codigoProduto.trim()) {
      setErro('Informe o codigo do produto do site.')
      return
    }

    setGerando(true)
    setResultado('')
    setArteBase('')

    try {
      const formData = new FormData()
      formData.append('mode', modo)
      if (arquivo) formData.append('image', arquivo)
      if (valor) formData.append('price', valor)
      if (codigoProduto) formData.append('productCode', codigoProduto)
      if (nomeProduto) formData.append('productName', nomeProduto)
      if (modo === 'site') formData.append('discountPercent', descontoSite)

      const response = await fetch('/api/mkt/generate', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
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
      })

      const finalDataUrl = await comporAnuncioFinal(data.imageDataUrl, data.precoFormatado, {
        nomeProduto: data.nomeProduto || nomeProduto,
        codigoProduto: data.codigoProduto || codigoProduto,
      })
      setResultado(finalDataUrl)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Falha inesperada ao gerar anuncio.')
      setDetalhes(null)
    } finally {
      setGerando(false)
    }
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

  return (
    <div className="bg-[radial-gradient(circle_at_top,#3b0000_0%,#140606_42%,#090909_100%)]">
      <div className="mx-auto flex w-full max-w-[1720px] flex-col gap-8 px-4 py-8 sm:px-6 xl:px-10">
        <section className="overflow-hidden rounded-[36px] border border-red-400/30 bg-white/95 shadow-[0_35px_100px_rgba(127,29,29,0.35)]">
          <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="bg-[linear-gradient(135deg,#7f0000_0%,#d10921_50%,#ff6b1a_100%)] px-6 py-8 text-white sm:px-8">
              <p className="text-[11px] font-black uppercase tracking-[0.34em] text-white/70">Painel MKT</p>
              <h1 className="mt-3 text-3xl font-black uppercase leading-tight sm:text-5xl">
                Gere anuncios prontos para status e stories
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/88 sm:text-base">
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
                <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                  <label className="block rounded-[30px] border border-dashed border-red-300 bg-[linear-gradient(180deg,#fff5f5_0%,#ffffff_100%)] p-5">
                    <span className="text-[11px] font-black uppercase tracking-[0.28em] text-red-700">Imagem do produto</span>
                    <div className="mt-4 flex min-h-[280px] items-center justify-center overflow-hidden rounded-[24px] bg-slate-100">
                      {previewProduto ? (
                        <img src={previewProduto} alt="Preview do produto" className="h-full max-h-[420px] w-full object-contain p-4" />
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

                  <div className="grid gap-4">
                    <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                      <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">Modo de geracao</p>
                      <div className="mt-4 grid gap-3">
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

                    <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
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

                    <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
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
                      <p className="mt-3 text-sm text-slate-500">
                        {modo === 'site'
                          ? 'Neste modo, o sistema usa o valor cadastrado no produto do site.'
                          : 'Preco final aplicado na placa vermelha do anuncio.'}
                      </p>
                      {valorFormatado ? (
                        <div className="mt-4 rounded-[20px] bg-red-50 px-4 py-4">
                          <div className="text-[11px] font-black uppercase tracking-[0.24em] text-red-600">Pre-visualizacao</div>
                          <div className="mt-2 text-3xl font-black text-red-700">{valorFormatado}</div>
                        </div>
                      ) : null}
                    </div>

                    {modo === 'site' ? (
                      <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
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
                        <p className="mt-3 text-sm text-slate-500">
                          O preco do site sera reduzido por esse percentual antes de entrar na arte.
                        </p>
                      </div>
                    ) : null}

                    <div className="rounded-[30px] border border-slate-200 bg-slate-950 p-5 text-white shadow-[0_20px_60px_rgba(15,23,42,0.2)]">
                      <p className="text-[11px] font-black uppercase tracking-[0.28em] text-white/55">Saida do anuncio</p>
                      <div className="mt-4 space-y-3 text-sm text-white/82">
                        <p>- formato vertical para story/status</p>
                        <p>- logo oficial da loja aplicada automaticamente</p>
                        <p>- preco exato em destaque forte</p>
                        <p>- visual promocional inspirado nas referencias enviadas</p>
                        <p>- headline com nome e codigo do produto</p>
                      </div>
                    </div>
                  </div>
                </div>

                {erro ? <div className="rounded-[24px] bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">{erro}</div> : null}

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={gerando}
                    className="inline-flex items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,#b30018_0%,#ff2d20_100%)] px-7 py-4 text-sm font-black uppercase tracking-[0.18em] text-white shadow-[0_24px_50px_rgba(185,28,28,0.35)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {gerando ? 'Gerando anuncio...' : 'Gerar anuncio'}
                  </button>

                  {resultado ? (
                    <button
                      type="button"
                      onClick={baixarImagem}
                      className="inline-flex items-center justify-center rounded-[22px] border border-slate-300 bg-white px-7 py-4 text-sm font-black uppercase tracking-[0.18em] text-slate-800"
                    >
                      Baixar PNG
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
              {resultado ? (
                <img src={resultado} alt="Anuncio gerado" className="max-h-[1120px] w-auto rounded-[26px] shadow-[0_25px_80px_rgba(0,0,0,0.45)]" />
              ) : (
                <div className="max-w-md text-center text-sm font-semibold leading-relaxed text-white/70">
                  A arte final vai aparecer aqui depois da geracao. O sistema aplica a placa de preco e a logo oficial automaticamente.
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-6">
            <div className="rounded-[34px] border border-white/10 bg-white/95 p-6 shadow-[0_28px_70px_rgba(15,23,42,0.16)]">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">Base criativa</p>
              <h2 className="mt-2 text-2xl font-black uppercase text-slate-950">Como o anuncio e montado</h2>
              <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">Fundo contextual coerente com o produto</div>
                <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">Produto em escala heroica e com mais volume visual</div>
                <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">Headlines curtas e promocionais</div>
                <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">Acabamento pensado para status e stories</div>
              </div>
            </div>

            <div className="rounded-[34px] border border-red-300/40 bg-[linear-gradient(135deg,#2b0000_0%,#65070d_45%,#b80f1d_100%)] p-6 text-white shadow-[0_28px_70px_rgba(127,29,29,0.26)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.28em] text-white/60">Direcao comercial</p>
                  <h2 className="mt-2 text-2xl font-black uppercase">Padrao visual do painel MKT</h2>
                </div>
                <img src="/logofundo.png" alt="Logo Galpao do Aco" className="h-14 w-auto shrink-0 rounded-xl bg-white/10 p-1.5" />
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
