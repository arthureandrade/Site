'use client'

import { useEffect } from 'react'
import { useCart } from '@/context/CartContext'
import { formatarPreco, imagemUrlProduto } from '@/lib/api'
import { ehProdutoFerroAco } from '@/lib/catalogo'

const WPP_NUMBER = '559532240115'

function montarMensagemWpp(items, totalPreco) {
  const linhas = items.map((item) => {
    const ocultarPreco = ehProdutoFerroAco(item)
    const preco = !ocultarPreco && item.preco > 0 ? formatarPreco(item.preco) : 'Sob consulta'
    return `${item.id} | ${item.nome} | ${item.qty} | ${preco}`
  })

  const totalLinha = items.some((item) => !ehProdutoFerroAco(item) && item.preco > 0)
    ? `\n*Total estimado: ${formatarPreco(totalPreco)}*`
    : ''

  return (
    `*PEDIDO - GALPAO DO ACO*\n\n` +
    `Ola! Gostaria de fazer o seguinte pedido:\n\n` +
    `*Codigo* | *Produto* | *Qtd* | *Preco Unit.*\n` +
    linhas.join('\n') +
    totalLinha +
    `\n\nAguardo confirmacao de disponibilidade e prazo de entrega.`
  )
}

function gerarPanfletoCarrinho(items) {
  const elegiveis = (items || []).filter((item) => !ehProdutoFerroAco(item))
  if (elegiveis.length === 0) return

  const popup = window.open('', '_blank', 'width=1120,height=820')
  if (!popup) return

  const telefoneDestaque = '(95) 3224-0115'
  const cards = elegiveis
    .slice(0, 10)
    .map((produto) => {
      const precoCheio = Number(produto.preco || 0)
      const precoOferta = precoCheio > 0 ? precoCheio * 0.88 : 0
      const foto = imagemUrlProduto(produto) || `${window.location.origin}/logo.jpeg`
      const qtd = Number(produto.qty || 1)
      return `
        <article class="card">
          <div class="thumbWrap">
            <img class="thumb" src="${foto}" alt="${produto.nome || 'Produto'}" />
            <div class="overlayNote">Imagem ilustrativa</div>
            <div class="badges">
              <span class="badge badge-green">Pronta entrega</span>
              <span class="badge badge-red">12% OFF online</span>
            </div>
          </div>
          <div class="info">
            <div class="topline">
              <div class="brand">${produto.marca || 'GALPAO DO ACO'}</div>
              <div class="offerTag">Oferta online</div>
            </div>
            <div class="cod">Cod. ${produto.id}</div>
            <h3>${produto.nome || ''}</h3>
            <div class="meta">Qtd. ${qtd}</div>
            <div class="priceBox">
              <div class="oldPrice">${precoCheio > 0 ? `De ${formatarPreco(precoCheio)}` : 'Preco sob consulta'}</div>
              <div class="price">${precoCheio > 0 ? `Por ${formatarPreco(precoOferta)}` : 'Sob consulta'}</div>
              <div class="pix">${precoCheio > 0 ? 'a vista' : 'consulte nossa equipe comercial'}</div>
            </div>
          </div>
        </article>
      `
    })
    .join('')

  popup.document.open()
  popup.document.write(`
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Panfleto do carrinho</title>
        <style>
          * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: A4; margin: 7mm; }
          body { margin: 0; font-family: Arial, sans-serif; color: #111827; background: #f3f4f6; }
          .sheet { background: white; border: 1px solid #e5e7eb; overflow: hidden; }
          .hero { display: grid; grid-template-columns: 1.15fr .85fr; gap: 16px; padding: 14px 18px; background:
            radial-gradient(circle at top left, rgba(255,255,255,.18), transparent 34%),
            linear-gradient(135deg, #7f0000 0%, #c1121f 55%, #ef4444 100%); color: white; align-items: center; }
          .brand { display: flex; align-items: center; gap: 14px; min-width: 0; }
          .logo { width: 124px; max-height: 52px; object-fit: contain; background: white; border-radius: 12px; padding: 6px 10px; }
          .eyebrow { font-size: 10px; font-weight: 800; letter-spacing: .2em; text-transform: uppercase; opacity: .92; }
          .title { margin: 4px 0 0; font-size: 27px; font-weight: 900; letter-spacing: -.04em; line-height: 1.02; }
          .subtitle { margin: 6px 0 0; font-size: 12px; opacity: .95; line-height: 1.25; max-width: 420px; }
          .phoneBox { text-align: right; }
          .phoneLabel { font-size: 10px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; opacity: .88; }
          .phone { margin-top: 5px; font-size: 32px; font-weight: 900; letter-spacing: -.04em; line-height: 1; }
          .phoneNote { margin-top: 6px; font-size: 12px; font-weight: 700; }
          .content { padding: 12px 14px 14px; background: linear-gradient(180deg, #fff8f8 0%, #ffffff 26%); }
          .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 12px; }
          .card { overflow: hidden; border-radius: 16px; border: 2px solid #dc2626; background: #fff; box-shadow: 0 8px 18px rgba(127, 29, 29, 0.08); }
          .thumbWrap { position: relative; height: 150px; overflow: hidden; background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%); }
          .thumb { width: 100%; height: 100%; object-fit: cover; background: white; }
          .overlayNote { position: absolute; right: 8px; bottom: 8px; border-radius: 999px; background: rgba(0,0,0,.72); padding: 4px 8px; color: white; font-size: 8px; font-weight: 900; letter-spacing: .14em; text-transform: uppercase; }
          .badges { position: absolute; left: 8px; top: 8px; display: flex; flex-wrap: wrap; gap: 6px; }
          .badge { border-radius: 999px; padding: 4px 8px; color: white; font-size: 8px; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }
          .badge-green { background: #22c55e; }
          .badge-red { background: #b40000; }
          .info { padding: 10px 12px 12px; }
          .topline { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
          .brand { min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 9px; font-weight: 900; letter-spacing: .22em; text-transform: uppercase; color: #b40000; }
          .offerTag { border-radius: 999px; border: 1px solid rgba(180,0,0,.14); background: rgba(180,0,0,.05); padding: 4px 8px; font-size: 8px; font-weight: 900; letter-spacing: .14em; text-transform: uppercase; color: #b40000; }
          .cod { margin-top: 5px; font-size: 9px; font-family: monospace; color: #9ca3af; }
          .card h3 { margin: 6px 0 0; min-height: 44px; font-size: 14px; line-height: 1.12; font-weight: 700; color: #111827; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
          .meta { margin-top: 5px; font-size: 8px; font-weight: 800; letter-spacing: .11em; text-transform: uppercase; color: #6b7280; }
          .priceBox { margin-top: 8px; border-radius: 16px; border: 1px solid #f3f4f6; background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%); padding: 8px 10px; }
          .oldPrice { font-size: 10px; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; color: #9ca3af; text-decoration: line-through; }
          .price { margin-top: 3px; font-size: 22px; font-weight: 900; line-height: 1; color: #111827; }
          .pix { margin-top: 4px; font-size: 10px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; color: #b40000; }
          .footer { display: flex; justify-content: space-between; gap: 10px; padding: 0 14px 12px; color: #6b7280; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="sheet">
          <section class="hero">
            <div class="brand">
              <img class="logo" src="${window.location.origin}/logo.jpeg" alt="Galpao do Aco" />
              <div>
                <div class="eyebrow">Panfleto comercial</div>
                <div class="title">Itens selecionados para sua compra</div>
                <div class="subtitle">Selecao montada a partir do carrinho, com foco em oferta online, imagem forte e leitura rapida para postar ou enviar no WhatsApp.</div>
              </div>
            </div>
            <div class="phoneBox">
              <div class="phoneLabel">Contato rapido</div>
              <div class="phone">${telefoneDestaque}</div>
              <div class="phoneNote">Peca seu orcamento no WhatsApp</div>
            </div>
          </section>
          <section class="content">
            <div class="grid">${cards}</div>
          </section>
          <div class="footer">
            <div>Galpao do Aco • selecao gerada pelo carrinho</div>
            <div>Estoque sujeito a disponibilidade</div>
          </div>
        </div>
        <script>window.onload = () => setTimeout(() => window.print(), 250)</script>
      </body>
    </html>
  `)
  popup.document.close()
}

export default function CartDrawer({ open, onClose }) {
  const { items, dispatch, totalItens } = useCart()
  const totalVisivel = items.reduce(
    (acc, item) => (ehProdutoFerroAco(item) ? acc : acc + Number(item.preco || 0) * Number(item.qty || 0)),
    0
  )
  const existePrecoVisivel = items.some((item) => !ehProdutoFerroAco(item) && Number(item.preco || 0) > 0)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  function enviarPedido() {
    if (items.length === 0) return
    const msg = montarMensagemWpp(items, totalVisivel)
    const url = `https://wa.me/${WPP_NUMBER}?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity"
          onClick={onClose}
        />
      )}

      <div className={`
        fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl
        transition-transform duration-300
        ${open ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex items-center justify-between bg-[#CC0000] px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            <span className="text-lg font-bold">Carrinho</span>
            {totalItens > 0 && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-black text-[#CC0000]">
                {totalItens}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1 transition-opacity hover:opacity-75">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 py-16 text-gray-400">
              <svg className="h-16 w-16 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              <p className="font-medium">Seu carrinho esta vazio</p>
              <button onClick={onClose} className="text-sm font-semibold text-[#CC0000] hover:underline">
                Continuar comprando
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-3 rounded-xl bg-gray-50 p-3">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[10px] text-gray-400">Cod. {item.id}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs font-semibold leading-snug text-gray-900">
                    {item.nome}
                  </p>
                  <p className="mt-1 text-sm font-black text-[#CC0000]">
                    {!ehProdutoFerroAco(item) && item.preco > 0 ? formatarPreco(item.preco) : 'Sob consulta'}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end justify-between gap-2">
                  <button
                    onClick={() => dispatch({ type: 'REMOVE', id: item.id })}
                    className="text-gray-300 transition-colors hover:text-red-500"
                    title="Remover item"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => dispatch({ type: 'DEC', id: item.id })}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-300 text-base font-bold leading-none text-gray-600 transition-colors hover:border-[#CC0000] hover:text-[#CC0000]"
                    >
                      -
                    </button>
                    <span className="w-7 text-center text-sm font-bold text-gray-900">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => dispatch({ type: 'INC', id: item.id })}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-300 text-base font-bold leading-none text-gray-600 transition-colors hover:border-[#CC0000] hover:text-[#CC0000]"
                    >
                      +
                    </button>
                  </div>

                  {!ehProdutoFerroAco(item) && item.preco > 0 && (
                    <p className="text-xs text-gray-500">
                      = {formatarPreco(item.preco * item.qty)}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="space-y-3 border-t border-gray-200 bg-white px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Total estimado</span>
              <span className="text-xl font-black text-gray-900">
                {existePrecoVisivel ? formatarPreco(totalVisivel) : 'A consultar'}
              </span>
            </div>

            <button
              onClick={() => gerarPanfletoCarrinho(items)}
              className="w-full rounded-xl border border-amber-300 bg-amber-50 py-3 font-bold text-amber-700 transition-all hover:bg-amber-100 active:scale-95"
            >
              Gerar panfleto dos itens
            </button>

            <button
              onClick={enviarPedido}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#25D366] py-3.5 font-bold text-white transition-all hover:bg-[#1ebe5a] active:scale-95"
            >
              <svg className="h-5 w-5 fill-white" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Enviar pedido pelo WhatsApp
            </button>

            <button
              onClick={() => dispatch({ type: 'CLEAR' })}
              className="w-full py-1 text-xs text-gray-400 transition-colors hover:text-red-500"
            >
              Limpar carrinho
            </button>
          </div>
        )}
      </div>
    </>
  )
}
