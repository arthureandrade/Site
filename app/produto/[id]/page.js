import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatarParcelamento, formatarPreco, getProduto, imagemUrl, whatsappLink } from '@/lib/api'

export async function generateMetadata({ params }) {
  const produto = await getProduto(params.id)
  if (!produto) return { title: 'Produto nao encontrado' }

  return {
    title: produto.nome,
    description: produto.descricao || `${produto.nome} - ${formatarPreco(produto.preco)}`,
  }
}

export default async function ProdutoPage({ params }) {
  const produto = await getProduto(params.id)
  if (!produto) notFound()

  const foto = imagemUrl(produto.foto_url)
  const temEstoque = produto.estoque > 0
  const linkWpp = whatsappLink(produto.nome, produto.preco)
  const parcelamento = formatarParcelamento(produto.preco, 10)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <nav className="mb-8 flex items-center gap-2 text-sm text-gray-500">
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

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:gap-16">
        <div className="relative aspect-square overflow-hidden rounded-3xl border border-gray-200 bg-gray-100 shadow-sm">
          {foto ? (
            <Image
              src={foto}
              alt={produto.nome}
              fill
              unoptimized
              className="object-contain p-6"
              sizes="(max-width: 768px) 100vw, 50vw"
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

        <div className="flex flex-col">
          {produto.marca && (
            <span className="mb-2 text-sm font-black uppercase tracking-[0.24em] text-primary">{produto.marca}</span>
          )}

          <h1 className="mb-4 text-3xl font-extrabold leading-tight text-gray-900 sm:text-4xl">{produto.nome}</h1>

          {produto.descricao && (
            <p className="mb-6 border-l-4 border-primary/30 pl-4 leading-relaxed text-gray-600">{produto.descricao}</p>
          )}

          <div className="mb-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-1 text-sm text-gray-500">Preco de venda</div>
            <div className="text-4xl font-extrabold text-gray-900">{formatarPreco(produto.preco)}</div>
            <div className="mt-3 inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-black uppercase tracking-wide text-white">
              ou {parcelamento} sem juros
            </div>
          </div>

          <div className="mb-8 flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${temEstoque ? 'bg-green-500' : 'bg-red-400'}`} />
            <span className={`text-sm font-semibold ${temEstoque ? 'text-green-700' : 'text-red-600'}`}>
              {temEstoque
                ? `Em estoque - ${produto.estoque.toLocaleString('pt-BR')} unidades disponiveis`
                : 'Produto temporariamente indisponivel'}
            </span>
          </div>

          <div className="mt-auto flex flex-col gap-3 sm:flex-row">
            {temEstoque && (
              <a
                href={linkWpp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-3 rounded-2xl bg-green-500 px-6 py-4 text-base font-black text-white shadow-md transition-all hover:bg-green-600 active:scale-95"
              >
                <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Pedir pelo WhatsApp
              </a>
            )}

            <Link
              href="/produtos"
              className="flex items-center justify-center gap-2 rounded-2xl border-2 border-gray-200 px-6 py-4 text-sm font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50"
            >
              Voltar ao catalogo
            </Link>
          </div>

          <div className="mt-6 border-t border-gray-100 pt-5">
            <p className="text-xs text-gray-400">
              Codigo interno: <span className="font-mono">{produto.id}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
