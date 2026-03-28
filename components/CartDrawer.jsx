'use client'

import { useCart } from '@/context/CartContext'
import { formatarPreco } from '@/lib/api'
import { useEffect } from 'react'

const WPP_NUMBER = '5595032240115'

function montarMensagemWpp(items, totalPreco) {
  const linhas = items.map(item => {
    const preco = item.preco > 0 ? formatarPreco(item.preco) : 'A consultar'
    return `${item.id} | ${item.nome} | ${item.qty} | ${preco}`
  })

  const totalLinha = items.some(i => i.preco > 0)
    ? `\n*Total estimado: ${formatarPreco(totalPreco)}*`
    : ''

  return (
    `🛒 *PEDIDO - GALPÃO DO AÇO*\n\n` +
    `Olá! Gostaria de fazer o seguinte pedido:\n\n` +
    `*Código* | *Produto* | *Qtd* | *Preço Unit.*\n` +
    linhas.join('\n') +
    totalLinha +
    `\n\nAguardo confirmação de disponibilidade e prazo de entrega.`
  )
}

export default function CartDrawer({ open, onClose }) {
  const { items, dispatch, totalItens, totalPreco } = useCart()

  // Bloqueia scroll do body quando drawer está aberto
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  function enviarPedido() {
    if (items.length === 0) return
    const msg = montarMensagemWpp(items, totalPreco)
    const url = `https://wa.me/${WPP_NUMBER}?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
  }

  return (
    <>
      {/* Overlay escuro */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div className={`
        fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl
        flex flex-col transition-transform duration-300
        ${open ? 'translate-x-0' : 'translate-x-full'}
      `}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#CC0000] text-white">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            <span className="font-bold text-lg">Carrinho</span>
            {totalItens > 0 && (
              <span className="bg-white text-[#CC0000] text-xs font-black rounded-full w-6 h-6 flex items-center justify-center">
                {totalItens}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1 hover:opacity-75 transition-opacity">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Lista de itens */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400 py-16">
              <svg className="w-16 h-16 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              <p className="font-medium">Seu carrinho está vazio</p>
              <button onClick={onClose} className="text-[#CC0000] font-semibold text-sm hover:underline">
                Continuar comprando
              </button>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="bg-gray-50 rounded-xl p-3 flex gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-400 font-mono">Cód. {item.id}</p>
                  <p className="text-xs font-semibold text-gray-900 leading-snug line-clamp-2 mt-0.5">
                    {item.nome}
                  </p>
                  <p className="text-sm font-black text-[#CC0000] mt-1">
                    {item.preco > 0 ? formatarPreco(item.preco) : 'A consultar'}
                  </p>
                </div>

                <div className="flex flex-col items-end justify-between gap-2 shrink-0">
                  {/* Botão remover */}
                  <button
                    onClick={() => dispatch({ type: 'REMOVE', id: item.id })}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                    title="Remover item"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>

                  {/* Controle de quantidade */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => dispatch({ type: 'DEC', id: item.id })}
                      className="w-7 h-7 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:border-[#CC0000] hover:text-[#CC0000] transition-colors font-bold text-base leading-none"
                    >−</button>
                    <span className="w-7 text-center text-sm font-bold text-gray-900">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => dispatch({ type: 'INC', id: item.id })}
                      className="w-7 h-7 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:border-[#CC0000] hover:text-[#CC0000] transition-colors font-bold text-base leading-none"
                    >+</button>
                  </div>

                  {/* Subtotal */}
                  {item.preco > 0 && (
                    <p className="text-xs text-gray-500">
                      = {formatarPreco(item.preco * item.qty)}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer com total e botão */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 px-5 py-4 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 font-medium">Total estimado</span>
              <span className="text-xl font-black text-gray-900">
                {totalPreco > 0 ? formatarPreco(totalPreco) : 'A consultar'}
              </span>
            </div>

            <button
              onClick={enviarPedido}
              className="w-full bg-[#25D366] hover:bg-[#1ebe5a] active:scale-95 transition-all
                         text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2.5"
            >
              {/* Ícone WhatsApp */}
              <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Enviar pedido pelo WhatsApp
            </button>

            <button
              onClick={() => dispatch({ type: 'CLEAR' })}
              className="w-full text-xs text-gray-400 hover:text-red-500 transition-colors py-1"
            >
              Limpar carrinho
            </button>
          </div>
        )}
      </div>
    </>
  )
}
