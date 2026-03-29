import ProdutosCliente from '@/components/ProdutosCliente'

export const metadata = {
  title: 'Produtos | Galpão do Aço',
  description: 'Catálogo completo de material de construção com estoque real e preços atualizados.',
}

export default function ProdutosPage({ searchParams }) {
  const initialBusca = searchParams?.busca || ''
  const initialMarca = searchParams?.marca || ''

  return (
    <>
      {/* Cabeçalho */}
      <div className="bg-brand border-b-2 border-primary text-white py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="h-1 w-10 bg-primary rounded mb-3" />
          <h1 className="font-display text-4xl sm:text-5xl uppercase mb-2">Nossos Produtos</h1>
          <p className="text-gray-400 text-sm">
            Preços e estoque atualizados em tempo real direto do nosso sistema.
          </p>
        </div>
      </div>

      <ProdutosCliente initialBusca={initialBusca} initialMarca={initialMarca} />
    </>
  )
}
