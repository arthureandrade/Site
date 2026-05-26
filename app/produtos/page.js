import ProdutosCliente from '@/components/ProdutosCliente'
import CatalogViewTracker from '@/components/CatalogViewTracker'
import { carregarCatalogoInicial } from '@/lib/catalogoPublico'
import { buildCatalogItemListJsonLd } from '@/lib/seo'

export const metadata = {
  title: 'Produtos | Galpão do Aço',
  description: 'Catálogo completo de material de construção com estoque real e preços atualizados.',
}

export default async function ProdutosPage({ searchParams }) {
  const params = (await searchParams) || {}
  const initialBusca = params?.busca || ''
  const initialMarca = params?.marca || ''
  const initialCategoria = params?.categoria || ''
  const initialSecao = params?.secao || ''
  const initialSubgrupo = params?.subgrupo || ''
  const descricao = initialCategoria === 'ferro_aco'
    ? 'Ferro e aço da seção 6. Valores sob consulta no WhatsApp.'
    : initialSecao && initialSubgrupo
      ? `Produtos filtrados pela seção ${initialSecao} e subgrupo ${initialSubgrupo}.`
      : initialSubgrupo
        ? `Produtos filtrados pelo subgrupo ${initialSubgrupo}.`
      : 'Preços e estoque atualizados em tempo real direto do nosso sistema.'

  const catalogoInicial = await carregarCatalogoInicial({
    busca: initialBusca,
    marca: initialMarca,
    categoriaEspecial: initialCategoria,
    secaoEspecial: initialSecao,
    subgrupoEspecial: initialSubgrupo,
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
        busca={initialBusca}
        categoria={initialCategoria}
        secao={initialSecao}
        subgrupo={initialSubgrupo}
        total={produtosIniciais.length}
      />
      <div className="bg-brand border-b-2 border-primary px-4 py-6 text-white sm:py-8">
        <div className="mx-auto max-w-[1760px]">
          <div className="h-1 w-10 bg-primary rounded mb-3" />
          <h1 className="font-display text-3xl uppercase mb-2 sm:text-4xl">Nossos Produtos</h1>
          <p className="text-gray-400 text-[13px] sm:text-sm">{descricao}</p>
        </div>
      </div>

      <ProdutosCliente
        initialBusca={initialBusca}
        initialMarca={initialMarca}
        initialCategoria={initialCategoria}
        initialSecao={initialSecao}
        initialSubgrupo={initialSubgrupo}
        initialProdutos={produtosIniciais}
        initialMarcasCatalogo={marcasIniciais}
        initialCategoriasCatalogo={categoriasIniciais}
      />
    </>
  )
}
