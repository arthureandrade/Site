import ProdutosCliente from '@/components/ProdutosCliente'

export const metadata = {
  title: 'Produtos | Galpao do Aco',
  description: 'Catalogo completo de material de construcao com estoque real e precos atualizados.',
}

export default function ProdutosPage({ searchParams }) {
  const initialBusca = searchParams?.busca || ''
  const initialMarca = searchParams?.marca || ''
  const initialCategoria = searchParams?.categoria || ''
  const descricao = initialCategoria === 'ferro_aco'
    ? 'Ferro e Aco da secao 6. Valores sob consulta no WhatsApp.'
    : 'Precos e estoque atualizados em tempo real direto do nosso sistema.'

  return (
    <>
      <div className="bg-brand border-b-2 border-primary px-4 py-10 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="h-1 w-10 bg-primary rounded mb-3" />
          <h1 className="font-display text-4xl sm:text-5xl uppercase mb-2">Nossos Produtos</h1>
          <p className="text-gray-400 text-sm">{descricao}</p>
        </div>
      </div>

      <ProdutosCliente
        initialBusca={initialBusca}
        initialMarca={initialMarca}
        initialCategoria={initialCategoria}
      />
    </>
  )
}
