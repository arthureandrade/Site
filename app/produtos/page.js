import ProdutosCliente from '@/components/ProdutosCliente'

export const metadata = {
  title: 'Produtos',
  description: 'Catálogo completo de material de construção com estoque real e preços atualizados.',
}

export default function ProdutosPage() {
  return (
    <>
      {/* Cabeçalho da página */}
      <div className="bg-brand text-white py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">Nossos Produtos</h1>
          <p className="text-gray-400 text-sm">
            Preços e estoque atualizados em tempo real direto do nosso sistema.
          </p>
        </div>
      </div>

      {/* Grid interativo com filtros */}
      <ProdutosCliente />
    </>
  )
}
