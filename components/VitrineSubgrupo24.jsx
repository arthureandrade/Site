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
          section: 'bg-[radial-gradient(circle_at_top_left,rgba(22,163,74,0.18),transparent_28%),linear-gradient(180deg,#0f3d21_0%,#1b5e31_18%,#e9f9ed_18%,#ffffff_100%)]',
          border: 'border-emerald-300 bg-[linear-gradient(180deg,#f8fff9_0%,#effcf1_100%)]',
          labelBg: 'bg-emerald-700',
          title: 'text-emerald-950',
          cta: 'border-emerald-700 text-emerald-700 hover:border-emerald-600 hover:text-emerald-600',
          resumo: 'bg-emerald-100 text-emerald-900',
          shell: 'relative overflow-hidden shadow-[0_24px_70px_rgba(22,101,52,0.16)]',
          topBand: 'mb-4 rounded-[22px] bg-[linear-gradient(135deg,#134e2b_0%,#1d6b39_58%,#2f8f4e_100%)] p-4 text-white sm:p-5',
          deco: 'absolute right-[-40px] top-[-34px] h-44 w-44 rounded-full bg-emerald-300/12 blur-2xl',
          micro: 'text-emerald-100/80',
          chips: 'bg-white/12 text-white border-white/10',
        }
      : {
          section: 'bg-gradient-to-b from-white via-[#fff7f4] to-white',
          border: 'border-red-200',
          labelBg: 'bg-brand',
          title: 'text-brand',
          cta: 'border-brand text-brand hover:border-primary hover:text-primary',
          resumo: 'bg-red-50 text-primary',
          shell: '',
          topBand: '',
          deco: '',
          micro: '',
          chips: '',
        }

  return (
    <section id={sectionId} className={`${temaClasses.section} py-4 lg:py-6`}>
      <div className="mx-auto max-w-[1760px] px-4 sm:px-6 lg:px-8">
        <div className={`rounded-[22px] border p-3 shadow-[0_16px_50px_rgba(15,23,42,0.06)] sm:rounded-[26px] sm:p-4 lg:p-5 ${temaClasses.border} ${temaClasses.shell}`}>
          {tema === 'green' && <div className={temaClasses.deco} />}

          {tema === 'green' ? (
            <div className={temaClasses.topBand}>
              <div className="relative z-[1] flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-4xl">
                  <div className={`inline-flex rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-white ${temaClasses.labelBg}`}>
                    {label}
                  </div>
                  <h2 className="mt-3 max-w-3xl text-2xl font-black uppercase leading-[1.02] text-white sm:text-[2.2rem]">
                    {titulo}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-emerald-50/90 sm:text-[15px]">
                    {descricao}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] ${temaClasses.chips}`}>
                      Campo
                    </span>
                    <span className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] ${temaClasses.chips}`}>
                      Rotina rural
                    </span>
                    <span className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] ${temaClasses.chips}`}>
                      14% online
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-start gap-3 lg:items-end">
                  <div className={`text-[11px] font-black uppercase tracking-[0.24em] ${temaClasses.micro}`}>
                    Linha especializada
                  </div>
                  <Link
                    href={href}
                    className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-emerald-800 shadow-[0_14px_34px_rgba(9,30,18,0.18)] transition hover:scale-[1.01]"
                  >
                    {cta}
                  </Link>
                </div>
              </div>
            </div>
          ) : (
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
          )}

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
