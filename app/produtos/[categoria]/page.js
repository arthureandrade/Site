import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import ProdutosCliente from '@/components/ProdutosCliente'
import CatalogViewTracker from '@/components/CatalogViewTracker'
import {
  inferirCategoriaProduto,
  obterCategoriaPorSlugCatalogo,
  slugCategoriaCatalogo,
  SECOES_CATALOGO,
} from '@/lib/catalogoPublico'
import { PUBLIC_CACHE_SECONDS } from '@/lib/cacheConfig'
import { carregarCatalogoInicialComCache } from '@/lib/catalogoPublicoServer'
import { buildCatalogItemListJsonLd } from '@/lib/seo'

export const revalidate = 900
export const dynamicParams = false

export function generateStaticParams() {
  return SECOES_CATALOGO.map((categoria) => ({
    categoria: slugCategoriaCatalogo(categoria.nome),
  }))
}

export async function generateMetadata({ params }) {
  const resolvedParams = (await params) || {}
  const categoria = obterCategoriaPorSlugCatalogo(resolvedParams.categoria)

  if (!categoria) {
    return {
      title: 'Produtos | Galpão do Aço',
    }
  }

  return {
    title: `${categoria.nome} em Boa Vista RR`,
    description: `Catálogo de ${categoria.nome.toLowerCase()} do Galpão do Aço em Boa Vista/RR. Consulte produtos, estoque e orçamento pelo WhatsApp.`,
    alternates: {
      canonical: `/produtos/${slugCategoriaCatalogo(categoria.nome)}`,
    },
  }
}

export default async function ProdutosCategoriaPage({ params }) {
  const resolvedParams = (await params) || {}
  const categoriaCatalogo = obterCategoriaPorSlugCatalogo(resolvedParams.categoria)

  if (!categoriaCatalogo) notFound()

  const descricao = `Produtos de ${categoriaCatalogo.nome.toLowerCase()} com navegação direta por categoria, estoque atualizado e orçamento pelo WhatsApp.`

  const catalogoInicial = await carregarCatalogoInicialComCache({
    emEstoque: true,
  })

  const produtosIniciais = catalogoInicial.produtos || []
  const produtosDaCategoria = produtosIniciais.filter(
    (produto) => inferirCategoriaProduto(produto) === categoriaCatalogo.nome
  )
  const marcasIniciais = catalogoInicial.marcasCatalogo || []
  const categoriasIniciais = catalogoInicial.categoriasCatalogo || []
  const itemListJsonLd = buildCatalogItemListJsonLd(produtosDaCategoria)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <CatalogViewTracker
        busca=""
        categoria={categoriaCatalogo.nome}
        secao=""
        subgrupo=""
        total={produtosDaCategoria.length}
      />
      <div className="bg-brand border-b-2 border-primary px-4 py-6 text-white sm:py-8">
        <div className="mx-auto max-w-[1760px]">
          <div className="h-1 w-10 bg-primary rounded mb-3" />
          <h1 className="font-display text-3xl uppercase mb-2 sm:text-4xl">
            {categoriaCatalogo.nome}
          </h1>
          <p className="text-gray-400 text-[13px] sm:text-sm">{descricao}</p>
        </div>
      </div>

      <Suspense fallback={null}>
        <ProdutosCliente
          initialCategoriaAtiva={categoriaCatalogo.nome}
          initialProdutos={produtosIniciais}
          initialMarcasCatalogo={marcasIniciais}
          initialCategoriasCatalogo={categoriasIniciais}
        />
      </Suspense>
    </>
  )
}
