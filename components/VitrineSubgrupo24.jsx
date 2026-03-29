import Link from 'next/link'
import OfertaCard from '@/components/OfertaCard'

export default function VitrineSubgrupo24({ produtos = [], origem = '' }) {
  return (
    <section className="bg-gradient-to-b from-white via-[#fff4ec] to-white py-8 lg:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rounded-[30px] border border-[#ff5a0a] bg-white p-4 shadow-[0_16px_50px_rgba(255,90,10,0.08)] lg:p-6">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex rounded-md bg-[#16246f] px-4 py-2 text-sm font-black uppercase tracking-wide text-white">
                Ofertas em destaque
              </div>
              <h2 className="mt-4 text-3xl font-black uppercase leading-tight text-[#13214e] sm:text-4xl">
                Aproveite as melhores oportunidades online da semana
              </h2>
              <p className="mt-3 max-w-3xl text-base text-slate-600">
                Produtos selecionados com 14% de desconto para acelerar sua compra online. Estoque, preco e condicoes atualizados automaticamente.
              </p>
            </div>
            <Link
              href="/produtos?subgrupo=24"
              className="inline-flex rounded-2xl border border-[#16246f] px-5 py-3 text-sm font-black uppercase tracking-wide text-[#16246f] transition hover:border-[#ff5a0a] hover:text-[#ff5a0a]"
            >
              Ver todos os destaques
            </Link>
          </div>

          {produtos.length ? (
            <>
              <div className="mb-5 rounded-2xl bg-[#fff1e8] px-4 py-3 text-sm font-semibold text-[#ff5a0a]">
                {produtos.length} oferta{produtos.length !== 1 ? 's' : ''} em destaque carregada
                {produtos.length !== 1 ? 's' : ''} para compra online.
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {produtos.map((produto, indice) => (
                  <OfertaCard
                    key={`subgrupo24-${produto.id}`}
                    produto={produto}
                    desconto={14}
                    badge="Online"
                    destaque={indice === 0}
                  />
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
      </div>
    </section>
  )
}
