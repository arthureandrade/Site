'use client'

import { useEffect, useMemo, useState } from 'react'

const TELEFONE_PRINCIPAL = '(95) 3224-0115'
const WHATSAPP_COMERCIAL = '(95) 99165-0808'
const ENDERECO_1 = 'Av. Gen. Ataide Teive, 4495 - Asa Branca'
const ENDERECO_2 = 'Av. Gen. Ataide Teive, 5928 - Santa Tereza'

function formatarPreco(valor) {
  const numero = Number(String(valor || '').replace(/[^\d,.-]/g, '').replace('.', '').replace(',', '.'))
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

function desenharCover(ctx, image, targetWidth, targetHeight) {
  const scale = Math.max(targetWidth / image.width, targetHeight / image.height)
  const width = image.width * scale
  const height = image.height * scale
  const x = (targetWidth - width) / 2
  const y = (targetHeight - height) / 2
  ctx.drawImage(image, x, y, width, height)
}

async function comporAnuncioFinal(baseImageSrc, precoTexto) {
  const [baseImage, logoImage] = await Promise.all([carregarImagem(baseImageSrc), carregarImagem('/logo.jpeg')])
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1920

  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  desenharCover(ctx, baseImage, canvas.width, canvas.height)

  const topGradient = ctx.createLinearGradient(0, 0, 0, 420)
  topGradient.addColorStop(0, 'rgba(0,0,0,0.76)')
  topGradient.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = topGradient
  ctx.fillRect(0, 0, canvas.width, 420)

  const bottomGradient = ctx.createLinearGradient(0, canvas.height - 700, 0, canvas.height)
  bottomGradient.addColorStop(0, 'rgba(0,0,0,0)')
  bottomGradient.addColorStop(0.35, 'rgba(0,0,0,0.28)')
  bottomGradient.addColorStop(1, 'rgba(24,0,0,0.92)')
  ctx.fillStyle = bottomGradient
  ctx.fillRect(0, canvas.height - 700, canvas.width, 700)

  const logoCardX = 640
  const logoCardY = 68
  const logoCardW = 360
  const logoCardH = 226

  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.35)'
  ctx.shadowBlur = 30
  ctx.fillStyle = 'rgba(35, 6, 6, 0.92)'
  ctx.strokeStyle = '#ff5038'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.roundRect(logoCardX, logoCardY, logoCardW, logoCardH, 28)
  ctx.fill()
  ctx.stroke()
  ctx.restore()

  ctx.save()
  ctx.beginPath()
  ctx.roundRect(logoCardX + 16, logoCardY + 16, logoCardW - 32, logoCardH - 32, 24)
  ctx.clip()
  ctx.drawImage(logoImage, logoCardX + 22, logoCardY + 22, logoCardW - 44, logoCardH - 44)
  ctx.restore()

  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.3)'
  ctx.shadowBlur = 24
  ctx.fillStyle = '#cf111f'
  ctx.beginPath()
  ctx.roundRect(42, 1420, 996, 236, 28)
  ctx.fill()
  ctx.restore()

  ctx.fillStyle = '#ffffff'
  ctx.font = '700 34px Arial'
  ctx.fillText('POR APENAS:', 84, 1498)

  ctx.font = '900 94px Arial'
  ctx.fillText('R$', 84, 1608)

  ctx.font = '900 118px Arial'
  ctx.fillText(precoTexto.replace('R$', '').trim(), 200, 1618)

  ctx.font = '700 44px Arial'
  ctx.fillText('A VISTA', 838, 1608)

  ctx.save()
  ctx.fillStyle = '#9a0b16'
  ctx.beginPath()
  ctx.roundRect(0, 1724, 1080, 196, 0)
  ctx.fill()
  ctx.restore()

  ctx.fillStyle = '#ffffff'
  ctx.font = '700 42px Arial'
  ctx.fillText(WHATSAPP_COMERCIAL, 72, 1798)
  ctx.fillText(TELEFONE_PRINCIPAL, 624, 1798)

  ctx.font = '600 26px Arial'
  ctx.fillText(`Loja Matriz  ${ENDERECO_1}`, 72, 1854)
  ctx.fillText(`Loja Filial  ${ENDERECO_2}`, 72, 1892)

  return canvas.toDataURL('image/png')
}

export default function MktAdStudio() {
  const [arquivo, setArquivo] = useState(null)
  const [previewProduto, setPreviewProduto] = useState('')
  const [valor, setValor] = useState('')
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

    if (!arquivo) {
      setErro('Envie uma imagem do produto para gerar o anuncio.')
      return
    }

    if (!valorFormatado) {
      setErro('Informe um valor valido para a oferta.')
      return
    }

    setGerando(true)
    setResultado('')
    setArteBase('')

    try {
      const formData = new FormData()
      formData.append('image', arquivo)
      formData.append('price', valor)

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
      })

      const finalDataUrl = await comporAnuncioFinal(data.imageDataUrl, data.precoFormatado)
      setResultado(finalDataUrl)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Falha inesperada ao gerar anuncio.')
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
                          Arraste ou selecione uma foto do produto em boa qualidade.
                        </div>
                      )}
                    </div>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="mt-4 block w-full text-sm" />
                  </label>

                  <div className="grid gap-4">
                    <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                      <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">Valor da oferta</p>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={valor}
                        onChange={(event) => setValor(event.target.value)}
                        placeholder="Ex: 4450,50"
                        className="mt-4 w-full rounded-[20px] border border-slate-200 px-4 py-4 text-2xl font-black text-slate-950 outline-none focus:border-red-500"
                      />
                      <p className="mt-3 text-sm text-slate-500">
                        Preco final aplicado na placa vermelha do anuncio.
                      </p>
                      {valorFormatado ? (
                        <div className="mt-4 rounded-[20px] bg-red-50 px-4 py-4">
                          <div className="text-[11px] font-black uppercase tracking-[0.24em] text-red-600">Pre-visualizacao</div>
                          <div className="mt-2 text-3xl font-black text-red-700">{valorFormatado}</div>
                        </div>
                      ) : null}
                    </div>

                    <div className="rounded-[30px] border border-slate-200 bg-slate-950 p-5 text-white shadow-[0_20px_60px_rgba(15,23,42,0.2)]">
                      <p className="text-[11px] font-black uppercase tracking-[0.28em] text-white/55">Saida do anuncio</p>
                      <div className="mt-4 space-y-3 text-sm text-white/82">
                        <p>- formato vertical para story/status</p>
                        <p>- logo oficial da loja aplicada automaticamente</p>
                        <p>- preco exato em destaque forte</p>
                        <p>- visual promocional inspirado nas referencias enviadas</p>
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

            <div className="mt-6 flex min-h-[560px] items-center justify-center rounded-[28px] bg-[linear-gradient(180deg,#140606_0%,#2a0a0a_100%)] p-4">
              {resultado ? (
                <img src={resultado} alt="Anuncio gerado" className="max-h-[780px] w-auto rounded-[24px] shadow-[0_25px_80px_rgba(0,0,0,0.45)]" />
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
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-white/60">Direcao comercial</p>
              <h2 className="mt-2 text-2xl font-black uppercase">Padrao visual do painel MKT</h2>
              <div className="mt-5 space-y-3 text-sm leading-relaxed text-white/85">
                <p>- visual forte, industrial e vendedor</p>
                <p>- foco quase total no produto e no preco</p>
                <p>- identidade da Galpao do Aco clara e chamativa</p>
                <p>- pronta para publicacao imediata no WhatsApp e Instagram</p>
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
