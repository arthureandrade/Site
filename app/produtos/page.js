import { Suspense } from 'react'
import ProdutosCliente from '@/components/ProdutosCliente'
import CatalogViewTracker from '@/components/CatalogViewTracker'
import { PUBLIC_CACHE_SECONDS } from '@/lib/cacheConfig'
import { carregarCatalogoInicialComCache } from '@/lib/catalogoPublicoServer'
import { buildCatalogItemListJsonLd } from '@/lib/seo'

export const revalidate = 900
export const dynamic = 'force-static'

export const metadata = {
  title: 'Produtos | Galpão do Aço',
  description: 'Catálogo completo de material de construção com estoque real e preços atualizados.',
}

export default async function ProdutosPage() {
  const catalogoInicial = await carregarCatalogoInicialComCache({
    emEstoque: true,
  })

  const produtosIniciais = catalogoInicial.produtos || []
  const marcasIniciais = catalogoInicial.marcasCatalogo || []
  const categoriasIniciais = catalogoInicial.categoriasCatalogo || []
  const itemListJsonLd = buildCatalogItemListJsonLd(produtosIniciais)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <CatalogViewTracker
        busca=""
        categoria=""
        secao=""
        subgrupo=""
        total={produtosIniciais.length}
      />
      <div className="bg-brand border-b-2 border-primary px-4 py-6 text-white sm:py-8">
        <div className="mx-auto max-w-[1760px]">
          <div className="h-1 w-10 bg-primary rounded mb-3" />
          <h1 className="font-display text-3xl uppercase mb-2 sm:text-4xl">Nossos Produtos</h1>
          <p className="text-gray-400 text-[13px] sm:text-sm">
            Preços e estoque atualizados com navegação rápida por produto e categoria.
          </p>
        </div>
      </div>

      <Suspense fallback={null}>
        <ProdutosCliente
          initialProdutos={produtosIniciais}
          initialMarcasCatalogo={marcasIniciais}
          initialCategoriasCatalogo={categoriasIniciais}
        />
      </Suspense>
    </>
  )
}
