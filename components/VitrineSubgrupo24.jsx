import Link from 'next/link'
import OfertaCard from '@/components/OfertaCard'

export default function VitrineSubgrupo24({
  produtos = [],
  origem = '',
  sectionId = 'ofertas',
  label = 'Ofertas em destaque',
  titulo = 'Aproveite as melhores oportunidades online da semana',
  descricao = 'Produtos selecionados com 14% de desconto para acelerar sua compra online. Estoque, preco e condicoes atualizados automaticamente.',
  href = '/produtos?subgrupo=24',
  cta = 'Ver todos os destaques',
  desconto = 14,
  badge = 'Online',
  vazioTitulo = 'Nao ha produto em destaque no momento.',
  resumo = '',
}) {
  return (
    <section id={sectionId} className="bg-gradient-to-b from-white via-[#fff7f4] to-white py-6 lg:py-10">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="rounded-[24px] border border-red-200 bg-white p-3 shadow-[0_16px_50px_rgba(15,23,42,0.06)] sm:rounded-[30px] sm:p-4 lg:p-6">
          <div className="mb-5 flex flex-col gap-3 lg:mb-6 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
            <div>
              <div className="inline-flex rounded-md bg-brand px-3 py-1.5 text-xs font-black uppercase tracking-wide text-white sm:px-4 sm:py-2 sm:text-sm">
                {label}
              </div>
              <h2 className="mt-3 text-2xl font-black uppercase leading-tight text-brand sm:mt-4 sm:text-4xl">
                {titulo}
              </h2>
              <p className="mt-2 max-w-3xl text-sm text-slate-600 sm:mt-3 sm:text-base">
                {descricao}
              </p>
            </div>
            <Link
              href={href}
              className="inline-flex w-full items-center justify-center rounded-2xl border border-brand px-5 py-3 text-sm font-black uppercase tracking-wide text-brand transition hover:border-primary hover:text-primary sm:w-auto"
            >
              {cta}
            </Link>
          </div>

          {produtos.length ? (
            <>
              <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-primary sm:mb-5">
                {resumo || `${produtos.length} item${produtos.length !== 1 ? 's' : ''} em destaque carregado${produtos.length !== 1 ? 's' : ''} para a vitrine.`}
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
                {produtos.map((produto, indice) => (
                  <OfertaCard
                    key={`${sectionId}-${produto.id}`}
                    produto={produto}
                    desconto={desconto}
                    badge={badge}
                    destaque={indice === 0}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
              <div className="text-sm font-black uppercase tracking-wide text-gray-700">{vazioTitulo}</div>
              <div className="mt-2 text-sm text-gray-500">
                A consulta dessa vitrine nao retornou itens para a home{origem ? ` (${origem})` : ''}.
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
