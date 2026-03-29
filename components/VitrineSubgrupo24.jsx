import Link from 'next/link'
import ProductCard from '@/components/ProductCard'
export default function VitrineSubgrupo24({ produtos = [], origem = '' }) {
  return (
    <section className="bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-primary">Destaque</div>
            <h2 className="mt-2 text-3xl font-black uppercase text-gray-900">Produtos do subgrupo 24</h2>
            <p className="mt-2 max-w-2xl text-sm text-gray-500">
              Vitrine isolada da home, carregada separadamente com filtro exclusivo do subgrupo 24.
            </p>
          </div>
          <Link
            href="/produtos?subgrupo=24"
            className="rounded-2xl border border-gray-300 px-5 py-3 text-sm font-black uppercase tracking-wide text-gray-700 transition hover:border-primary hover:text-primary"
          >
            Ver mais
          </Link>
        </div>

        {produtos.length ? (
          <>
            <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-primary">
              {produtos.length} produto{produtos.length !== 1 ? 's' : ''} encontrado
              {produtos.length !== 1 ? 's' : ''} no subgrupo 24.
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {produtos.map((produto) => (
                <ProductCard key={`subgrupo24-${produto.id}`} produto={produto} badgeLabel="Subgrupo 24" />
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
            <div className="text-sm font-black uppercase tracking-wide text-gray-700">Nao ha produto em destaque no momento.</div>
            <div className="mt-2 text-sm text-gray-500">
              A consulta do subgrupo 24 nao retornou itens para a home{origem ? ` (${origem})` : ''}.
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
