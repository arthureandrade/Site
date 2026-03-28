import Link from 'next/link'
import Image from 'next/image'
import { formatarPreco, imagemUrl } from '@/lib/api'

export default function ProductCard({ produto }) {
  const foto = imagemUrl(produto.foto_url)
  const temEstoque = produto.estoque > 0
  const temPreco   = produto.preco > 0

  return (
    <Link href={`/produto/${produto.id}`} className="card group flex flex-col overflow-hidden hover:-translate-y-1">

      {/* Imagem */}
      <div className="relative bg-gray-100 aspect-square overflow-hidden">
        {foto ? (
          <Image
            src={foto}
            alt={produto.nome}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 gap-2">
            {/* Ícone de metal/aço */}
            <svg className="w-14 h-14 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
            </svg>
            <span className="text-xs text-gray-500 uppercase tracking-widest">Sem foto</span>
          </div>
        )}

        {/* Badge de estoque */}
        <div className="absolute top-2 left-2">
          {temEstoque ? (
            <span className="badge-green shadow">Em estoque</span>
          ) : (
            <span className="badge-red shadow">Indisponível</span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        {produto.marca && produto.marca !== 'GERAL' && (
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest truncate">
            {produto.marca}
          </span>
        )}

        <span className="text-[10px] text-gray-400 font-mono">
          Cód. {produto.id}
        </span>
        <h3 className="font-semibold text-gray-900 text-xs leading-snug line-clamp-3 group-hover:text-primary transition-colors flex-1">
          {produto.nome}
        </h3>

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
          {temPreco ? (
            <span className="text-base font-black text-primary">
              {formatarPreco(produto.preco)}
            </span>
          ) : (
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              Consultar preço
            </span>
          )}
          {temEstoque && (
            <span className="text-[10px] text-gray-400">
              {produto.estoque >= 1000
                ? `${(produto.estoque / 1000).toFixed(0)}K un.`
                : `${produto.estoque} un.`}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
