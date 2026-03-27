import Link from 'next/link'
import Image from 'next/image'
import { formatarPreco, imagemUrl } from '@/lib/api'

export default function ProductCard({ produto }) {
  const foto = imagemUrl(produto.foto_url)
  const temEstoque = produto.estoque > 0

  return (
    <Link href={`/produto/${produto.id}`} className="card group flex flex-col overflow-hidden">

      {/* Imagem */}
      <div className="relative bg-gray-100 aspect-square overflow-hidden">
        {foto ? (
          <Image
            src={foto}
            alt={produto.nome}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
            <span className="text-xs">Sem foto</span>
          </div>
        )}

        {/* Badge de estoque */}
        <div className="absolute top-2 right-2">
          {temEstoque ? (
            <span className="badge-green shadow-sm">Em estoque</span>
          ) : (
            <span className="badge-red shadow-sm">Indisponível</span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        {produto.marca && (
          <span className="text-xs font-semibold text-primary uppercase tracking-wide truncate">
            {produto.marca}
          </span>
        )}

        <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {produto.nome}
        </h3>

        {produto.descricao && (
          <p className="text-xs text-gray-500 line-clamp-1 flex-1">
            {produto.descricao}
          </p>
        )}

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
          <span className="text-lg font-bold text-gray-900">
            {formatarPreco(produto.preco)}
          </span>
          <span className="text-xs text-gray-400">
            {produto.estoque > 0 ? `${produto.estoque} un.` : '—'}
          </span>
        </div>
      </div>
    </Link>
  )
}
