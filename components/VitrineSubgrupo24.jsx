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
  tema = 'red',
}) {
  const temaClasses =
    tema === 'green'
      ? {
          section: 'bg-[linear-gradient(180deg,#e7f8ea_0%,#f4fff4_42%,#ffffff_100%)]',
          border: 'border-emerald-300 bg-[linear-gradient(180deg,#ffffff_0%,#f3fff4_100%)]',
          labelBg: 'bg-emerald-700',
          title: 'text-emerald-950',
          cta: 'border-emerald-700 text-emerald-700 hover:border-emerald-600 hover:text-emerald-600',
          resumo: 'bg-emerald-50 text-emerald-800',
        }
      : {
          section: 'bg-gradient-to-b from-white via-[#fff7f4] to-white',
          border: 'border-red-200',
          labelBg: 'bg-brand',
          title: 'text-brand',
          cta: 'border-brand text-brand hover:border-primary hover:text-primary',
          resumo: 'bg-red-50 text-primary',
        }

  return (
    <section id={sectionId} className={`${temaClasses.section} py-4 lg:py-6`}>
      <div className="mx-auto max-w-[1760px] px-4 sm:px-6 lg:px-8">
        <div className={`rounded-[22px] border p-3 shadow-[0_16px_50px_rgba(15,23,42,0.06)] sm:rounded-[26px] sm:p-4 lg:p-5 ${temaClasses.border}`}>
          <div className="mb-4 flex flex-col gap-3 lg:mb-4 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
            <div>
              <div className={`inline-flex rounded-md px-3 py-1.5 text-xs font-black uppercase tracking-wide text-white sm:px-4 sm:py-2 sm:text-sm ${temaClasses.labelBg}`}>
                {label}
              </div>
              <h2 className={`mt-2 text-xl font-black uppercase leading-tight sm:mt-3 sm:text-[1.9rem] ${temaClasses.title}`}>
                {titulo}
              </h2>
              <p className="mt-1.5 max-w-3xl text-[13px] text-slate-600 sm:mt-2 sm:text-sm">
                {descricao}
              </p>
            </div>
            <Link
              href={href}
              className={`inline-flex w-full items-center justify-center rounded-2xl border px-4 py-2.5 text-xs font-black uppercase tracking-wide transition sm:w-auto sm:px-5 sm:py-3 sm:text-sm ${temaClasses.cta}`}
            >
              {cta}
            </Link>
          </div>

          {produtos.length ? (
            <>
              <div className={`mb-3 rounded-2xl px-4 py-2.5 text-[12px] font-semibold sm:mb-4 sm:text-sm ${temaClasses.resumo}`}>
                {resumo || `${produtos.length} item${produtos.length !== 1 ? 's' : ''} em destaque carregado${produtos.length !== 1 ? 's' : ''} para a vitrine.`}
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
                {produtos.map((produto, indice) => (
                  <OfertaCard
                    key={`${sectionId}-${produto.id}`}
                    produto={produto}
                    desconto={desconto}
                    badge={badge}
                    destaque={indice === 0}
                    compacto
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
