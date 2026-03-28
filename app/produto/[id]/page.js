import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProduto, formatarPreco, imagemUrl, whatsappLink } from '@/lib/api'

export async function generateMetadata({ params }) {
  const produto = await getProduto(params.id)
  if (!produto) return { title: 'Produto não encontrado' }
  return {
    title: produto.nome,
    description: produto.descricao || `${produto.nome} — ${formatarPreco(produto.preco)}`,
  }
}

export default async function ProdutoPage({ params }) {
  const produto = await getProduto(params.id)
  if (!produto) notFound()

  const foto       = imagemUrl(produto.foto_url)
  const temEstoque = produto.estoque > 0
  const linkWpp    = whatsappLink(produto.nome, produto.preco)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link href="/"         className="hover:text-primary transition-colors">Início</Link>
        <span>/</span>
        <Link href="/produtos" className="hover:text-primary transition-colors">Produtos</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium truncate max-w-xs">{produto.nome}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">

        {/* ── Imagem ──────────────────────────────────────────────── */}
        <div className="relative bg-gray-100 rounded-2xl overflow-hidden aspect-square shadow-sm">
          {foto ? (
            <Image
              src={foto}
              alt={produto.nome}
              fill
              unoptimized
              className="object-contain p-4"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-3">
              <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
              <span className="text-sm">Foto não disponível</span>
            </div>
          )}
        </div>

        {/* ── Informações ─────────────────────────────────────────── */}
        <div className="flex flex-col">

          {/* Marca */}
          {produto.marca && (
            <span className="text-sm font-bold text-primary uppercase tracking-widest mb-2">
              {produto.marca}
            </span>
          )}

          {/* Nome */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight mb-4">
            {produto.nome}
          </h1>

          {/* Descrição */}
          {produto.descricao && (
            <p className="text-gray-600 leading-relaxed mb-6 border-l-4 border-primary/30 pl-4">
              {produto.descricao}
            </p>
          )}

          {/* Preço */}
          <div className="bg-gray-50 rounded-2xl p-5 mb-6">
            <div className="text-sm text-gray-500 mb-1">Preço de venda (varejo)</div>
            <div className="text-4xl font-extrabold text-gray-900">
              {formatarPreco(produto.preco)}
            </div>
          </div>

          {/* Estoque */}
          <div className="flex items-center gap-3 mb-8">
            <div className={`w-3 h-3 rounded-full ${temEstoque ? 'bg-green-500' : 'bg-red-400'}`} />
            <span className={`text-sm font-semibold ${temEstoque ? 'text-green-700' : 'text-red-600'}`}>
              {temEstoque
                ? `Em estoque — ${produto.estoque.toLocaleString('pt-BR')} unidades disponíveis`
                : 'Produto temporariamente indisponível'}
            </span>
          </div>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-3 mt-auto">
            {temEstoque && (
              <a
                href={linkWpp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600
                           text-white font-bold px-6 py-4 rounded-xl transition-all active:scale-95 shadow-md text-base"
              >
                <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Pedir pelo WhatsApp
              </a>
            )}

            <Link
              href="/produtos"
              className="flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-700
                         font-semibold px-6 py-4 rounded-xl hover:border-gray-300 hover:bg-gray-50
                         transition-all text-sm"
            >
              ← Voltar ao catálogo
            </Link>
          </div>

          {/* Código interno */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-xs text-gray-400">Código interno: <span className="font-mono">{produto.id}</span></p>
          </div>
        </div>
      </div>
    </div>
  )
}
