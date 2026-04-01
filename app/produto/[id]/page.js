import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ProductCard from '@/components/ProductCard'
import ProductPurchaseActions from '@/components/ProductPurchaseActions'
import {
  formatarParcelamento,
  formatarPreco,
  getProduto,
  getProdutos,
  imagemUrlProduto,
  whatsappLink,
} from '@/lib/api'
import { calcularPrecoPromocional, obterDescontoPromocional } from '@/lib/ofertas'

export async function generateMetadata({ params }) {
  const produto = await getProduto(params.id)
  if (!produto) return { title: 'Produto nao encontrado' }

  const desconto = obterDescontoPromocional(produto)
  const precoPromocional = calcularPrecoPromocional(produto.preco, desconto)

  return {
    title: produto.nome,
    description:
      produto.descricao ||
      `${produto.nome} - ${
        desconto > 0 ? `${formatarPreco(precoPromocional)} a vista` : formatarPreco(produto.preco)
      }`,
  }
}

export default async function ProdutoPage({ params }) {
  const produto = await getProduto(params.id)
  if (!produto) notFound()

  const ocultarComercial = Number(produto.secao || 0) === 6
  const desconto = obterDescontoPromocional(produto)
  const precoPromocional = calcularPrecoPromocional(produto.preco, desconto)
  const foto = imagemUrlProduto(produto)
  const temEstoque = produto.estoque > 0
  const linkWpp = whatsappLink(produto.nome, desconto > 0 ? precoPromocional : produto.preco)
  const parcelamento = formatarParcelamento(produto.preco, 10)
  const [mesmoGrupo, mesmaMarca] = await Promise.all([
    getProdutos({
      secao: produto.secao,
      grupo: produto.grupo,
      em_estoque: true,
      com_preco: true,
      limit: 8,
      noStore: true,
    }),
    getProdutos({
      marca: produto.marca,
      secao: produto.secao,
      em_estoque: true,
      com_preco: true,
      limit: 8,
      noStore: true,
    }),
  ])

  const similaresMap = new Map()
  for (const item of [...(mesmoGrupo?.produtos || []), ...(mesmaMarca?.produtos || [])]) {
    if (!item?.id || Number(item.id) === Number(produto.id)) continue
    similaresMap.set(Number(item.id), item)
  }
  const similares = Array.from(similaresMap.values()).slice(0, 4)

  return (
    <div className="bg-[#f8f9fb]">
      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 sm:py-12 lg:px-8">
        <nav className="mb-5 flex items-center gap-2 overflow-x-auto text-xs text-gray-500 sm:mb-8 sm:text-sm">
          <Link href="/" className="transition-colors hover:text-primary">
            Inicio
          </Link>
          <span>/</span>
          <Link href="/produtos" className="transition-colors hover:text-primary">
            Produtos
          </Link>
          <span>/</span>
          <span className="max-w-xs truncate font-medium text-gray-800">{produto.nome}</span>
        </nav>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.08fr_0.92fr] xl:gap-12">
          <div className="rounded-[24px] border border-gray-200 bg-white p-3 shadow-sm sm:rounded-[32px] sm:p-6">
            <div className="relative aspect-square overflow-hidden rounded-[22px] border border-gray-100 bg-gradient-to-br from-white to-gray-50 sm:rounded-[28px]">
              {desconto > 0 && (
                <div className="absolute left-4 top-4 z-10 rounded-2xl bg-primary px-4 py-2 text-sm font-black uppercase tracking-[0.16em] text-white shadow-lg">
                  {desconto}% OFF online
                </div>
              )}
              {foto ? (
                <Image
                  src={foto}
                  alt={produto.nome}
                  fill
                  unoptimized
                  className="object-contain p-6 sm:p-8"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-brand text-white/70">
                  <svg className="h-20 w-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                  <span className="text-sm font-bold uppercase tracking-[0.25em]">Foto nao disponivel</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="rounded-[24px] border border-gray-200 bg-white p-4 shadow-sm sm:rounded-[32px] sm:p-8">
              <div className="flex flex-wrap items-center gap-3">
                {produto.marca && (
                  <span className="rounded-full bg-red-50 px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-primary">
                    {produto.marca}
                  </span>
                )}
                {produto.secao ? (
                  <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-slate-700">
                    Secao {produto.secao}
                  </span>
                ) : null}
                {desconto > 0 ? (
                  <span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                    Oferta valida para compra online
                  </span>
                ) : null}
              </div>

              <h1 className="mt-4 text-[1.75rem] font-extrabold leading-tight text-gray-900 sm:mt-5 sm:text-4xl xl:text-[2.7rem]">
                {produto.nome}
              </h1>

              <div className="mt-4 grid gap-2 sm:mt-5 sm:gap-3 sm:grid-cols-3">
                {[
                  ocultarComercial ? 'Condicoes comerciais sob consulta' : temEstoque ? 'Estoque real atualizado' : 'Estoque sob consulta',
                  'Compra rapida pelo WhatsApp',
                  ocultarComercial ? 'Atendimento para aco e estruturas' : 'Parcelamento em 10x no valor cheio',
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs font-semibold text-slate-700 sm:px-4 sm:py-3 sm:text-sm">
                    {item}
                  </div>
                ))}
              </div>

              {produto.descricao && (
                <p className="mt-6 border-l-4 border-primary/30 pl-4 leading-relaxed text-gray-600">{produto.descricao}</p>
              )}

              <div className="mt-6 rounded-[22px] border border-red-100 bg-gradient-to-br from-white via-white to-red-50 p-4 shadow-sm sm:mt-7 sm:rounded-[28px] sm:p-6">
                <div className="mb-1 text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">
                  {ocultarComercial ? 'Atendimento comercial' : 'Condicao comercial'}
                </div>
                {ocultarComercial ? (
                  <>
                    <div className="mt-2 text-3xl font-black leading-tight text-gray-900 sm:text-4xl">
                      Preco sob consulta
                    </div>
                    <div className="mt-3 inline-flex rounded-full bg-primary px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-white">
                      Produto da secao 6 com atendimento consultivo
                    </div>
                    <div className="mt-4 text-base font-semibold text-slate-700">
                      Fale com a equipe para cotacao, disponibilidade e prazo.
                    </div>
                  </>
                ) : desconto > 0 ? (
                  <>
                    <div className="text-sm font-black uppercase tracking-[0.18em] text-gray-400 line-through">
                      De: {formatarPreco(produto.preco)}
                    </div>
                    <div className="mt-2 flex flex-wrap items-end gap-3">
                      <span className="text-lg font-black text-primary sm:text-xl">R$</span>
                      <span className="text-[2.2rem] font-black leading-none text-gray-900 sm:text-5xl">
                        {formatarPreco(precoPromocional).replace('R$', '').trim()}
                      </span>
                      <span className="pb-2 text-sm font-black uppercase tracking-[0.18em] text-primary">
                        a vista
                      </span>
                    </div>
                    <div className="mt-3 inline-flex rounded-full bg-primary px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-white">
                      Desconto aplicado tambem nesta pagina
                    </div>
                  </>
                ) : (
                  <div className="mt-2 text-[2.2rem] font-black leading-none text-gray-900 sm:text-5xl">{formatarPreco(produto.preco)}</div>
                )}
                {!ocultarComercial && (
                  <div className="mt-4 text-base font-semibold text-slate-700">
                    ou {parcelamento} sem juros no valor cheio
                  </div>
                )}
              </div>

              {!ocultarComercial && (
                <div className="mt-6 flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${temEstoque ? 'bg-green-500' : 'bg-red-400'}`} />
                  <span className={`text-sm font-semibold ${temEstoque ? 'text-green-700' : 'text-red-600'}`}>
                    {temEstoque
                      ? `Em estoque - ${produto.estoque.toLocaleString('pt-BR')} unidades disponiveis`
                      : 'Produto temporariamente indisponivel'}
                  </span>
                </div>
              )}

              <div className="mt-8">
                {(temEstoque || ocultarComercial) && (
                  <ProductPurchaseActions
                    produto={produto}
                    comprarHref={linkWpp}
                    comprarLabel={ocultarComercial ? 'Solicitar cotacao' : 'Comprar'}
                    fullWidth
                  />
                )}

                <div className="mt-3">
                  <Link
                    href="/produtos"
                    className="flex items-center justify-center gap-2 rounded-2xl border-2 border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 sm:px-6 sm:py-4"
                  >
                    Voltar ao catalogo
                  </Link>
                </div>
              </div>

              <div className="mt-6 border-t border-gray-100 pt-5 text-xs text-gray-400">
                Codigo interno: <span className="font-mono">{produto.id}</span>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-8 rounded-[24px] border border-gray-200 bg-white p-4 shadow-sm sm:mt-12 sm:rounded-[32px] sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">
                Sugestao de compra
              </div>
              <h2 className="mt-2 text-2xl font-black uppercase text-gray-900 sm:text-3xl">
                Outros produtos semelhantes
              </h2>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                Selecionamos itens do mesmo grupo e da mesma marca para facilitar a continuacao da compra.
              </p>
            </div>
          </div>

          {similares.length ? (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4 xl:grid-cols-4">
              {similares.map((item) => (
                <ProductCard
                  key={`similar-${item.id}`}
                  produto={item}
                  ocultarPreco={Number(item.secao || 0) === 6}
                />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center text-sm font-semibold text-slate-500">
              Ainda nao encontramos produtos semelhantes para este item.
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
