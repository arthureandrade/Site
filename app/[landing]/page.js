import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import CatalogViewTracker from '@/components/CatalogViewTracker'
import ProductCard from '@/components/ProductCard'
import TrackedWhatsAppLink from '@/components/TrackedWhatsAppLink'
import { getProdutos, imagemUrlProduto } from '@/lib/api'
import { buildCatalogItemListJsonLd, absoluteSiteUrl } from '@/lib/seo'
import { SEO_LANDING_PAGES, getSeoLandingPage } from '@/lib/seoLandingPages'

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP || '559532240115'

export const dynamicParams = false

export function generateStaticParams() {
  return SEO_LANDING_PAGES.map((page) => ({ landing: page.slug }))
}

export async function generateMetadata({ params }) {
  const page = getSeoLandingPage(params.landing)
  if (!page) return {}

  return {
    title: page.title,
    description: page.description,
    alternates: {
      canonical: absoluteSiteUrl(`/${page.slug}`),
    },
    openGraph: {
      title: page.title,
      description: page.description,
      url: absoluteSiteUrl(`/${page.slug}`),
      images: ['/logo.jpeg'],
      locale: 'pt_BR',
      type: 'website',
    },
  }
}

export default async function LandingPage({ params }) {
  const page = getSeoLandingPage(params.landing)
  if (!page) notFound()

  const catalogo = await getProdutos({
    busca: page.busca,
    com_preco: page.catalogHref?.includes('ferro_aco') ? false : true,
    secao: page.catalogHref?.includes('ferro_aco') ? 6 : undefined,
    todas_secoes: page.catalogHref?.includes('ferro_aco') ? false : undefined,
    limit: 12,
    revalidate: 900,
  })
  const produtos = catalogo?.produtos || []
  const produtoVisual = produtos.find((produto) => /sandu/i.test(produto?.nome || '')) || produtos[0]
  const heroFoto = produtoVisual ? imagemUrlProduto(produtoVisual) : null
  const itemListJsonLd = buildCatalogItemListJsonLd(produtos)
  const faqJsonLd = page.faqs?.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: page.faqs.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      }
    : null
  const whatsappHref = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
    `Olá! Quero orçamento para ${page.categoryName}.`
  )}`

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <CatalogViewTracker
        categoria={page.categoryName}
        subgrupo={page.productType}
        total={produtos.length}
      />

      <section className="bg-[linear-gradient(135deg,#07111f_0%,#111827_56%,#7f0000_100%)] px-4 py-12 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1600px] gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-primary">
              {page.eyebrow}
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-black uppercase leading-none sm:text-5xl lg:text-6xl">
              {page.h1}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-200 sm:text-lg">
              {page.intro}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {page.bullets.map((item) => (
                <span key={item} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white">
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <TrackedWhatsAppLink
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                label={`seo_${page.slug}_whatsapp`}
                eventData={{
                  category: page.categoryName,
                  product_type: page.productType,
                }}
                className="rounded-2xl bg-green-500 px-6 py-4 text-center text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-green-600"
              >
                Pedir orçamento
              </TrackedWhatsAppLink>
              <Link
                href={page.catalogHref || `/produtos?busca=${encodeURIComponent(page.busca)}`}
                className="rounded-2xl border border-white/15 bg-white/10 px-6 py-4 text-center text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/15"
              >
                Ver produtos
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur">
            {page.visualStyle === 'sandwich-roof' ? (
              <div className="mb-6">
                <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,.28),transparent_28%),linear-gradient(135deg,#e5e7eb_0%,#f8fafc_42%,#94a3b8_100%)] p-5 shadow-2xl">
                  {heroFoto ? (
                    <div className="relative mb-4 aspect-[16/10] overflow-hidden rounded-[18px] bg-white/50">
                      <Image
                        src={heroFoto}
                        alt={produtoVisual?.nome || page.categoryName}
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="(max-width: 1024px) 90vw, 42vw"
                      />
                    </div>
                  ) : null}
                  <div className="relative mx-auto mt-2 max-w-md rotate-[-3deg]">
                    <div className="h-8 rounded-t-2xl border border-slate-300 bg-[repeating-linear-gradient(90deg,#f8fafc_0,#f8fafc_18px,#cbd5e1_18px,#cbd5e1_23px)] shadow-xl" />
                    <div className="h-9 border-x border-slate-300 bg-[linear-gradient(90deg,#fef3c7,#fde68a,#fef3c7)] shadow-inner" />
                    <div className="h-8 rounded-b-2xl border border-slate-300 bg-[repeating-linear-gradient(90deg,#e2e8f0_0,#e2e8f0_18px,#94a3b8_18px,#94a3b8_23px)] shadow-xl" />
                    <div className="absolute -right-4 top-1/2 rounded-full bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-lg">
                      termoacústica
                    </div>
                  </div>
                  <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                    {(page.heroStats || []).map((stat) => (
                      <div key={stat.label} className="rounded-2xl bg-white/85 p-3 text-slate-950 shadow-sm">
                        <div className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
                          {stat.label}
                        </div>
                        <div className="mt-1 text-sm font-black leading-tight">{stat.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="mt-4 text-xs font-semibold leading-relaxed text-slate-300">
                  Visual ilustrativo inspirado em telhas sanduíche pesquisadas: chapa metálica externa,
                  núcleo isolante e acabamento inferior.
                </p>
              </div>
            ) : null}
            <div className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">
              Atendimento local
            </div>
            <h2 className="mt-3 text-2xl font-black uppercase">Galpão do Aço em Boa Vista/RR</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-200">
              Consulte preço, estoque, medidas, retirada e condições comerciais com nossa equipe.
            </p>
            <div className="mt-5 grid gap-3 text-sm text-slate-200">
              <div className="rounded-2xl bg-black/20 p-4">Av. Ataíde Teive, 5928</div>
              <div className="rounded-2xl bg-black/20 p-4">Av. Ataíde Teive, 4509</div>
              <div className="rounded-2xl bg-black/20 p-4">(95) 3224-0115</div>
            </div>
          </div>
        </div>
      </section>

      {(page.benefits?.length || page.useCases?.length || page.specs?.length) && (
        <section className="bg-white px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1600px]">
            <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-[30px] bg-slate-950 p-6 text-white shadow-2xl sm:p-8">
                <div className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">
                  Por que escolher
                </div>
                <h2 className="mt-3 text-3xl font-black uppercase leading-tight">
                  Telha sanduíche é conforto para quem sente o calor da cobertura
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-slate-300">
                  As referências pesquisadas mostram a telha termoacústica como uma solução em camadas:
                  duas chapas metálicas e um núcleo isolante, pensada para reduzir calor e ruído em coberturas.
                </p>
                <div className="mt-6 grid gap-3">
                  {(page.specs || []).map((item) => (
                    <div key={item.label} className="flex items-start justify-between gap-4 rounded-2xl bg-white/10 p-4">
                      <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{item.label}</span>
                      <span className="max-w-[65%] text-right text-sm font-bold text-white">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {(page.benefits || []).map((item) => (
                  <div key={item.title} className="rounded-[26px] border border-slate-200 bg-slate-50 p-6 shadow-sm">
                    <div className="mb-4 h-2 w-14 rounded-full bg-primary" />
                    <h3 className="text-xl font-black uppercase text-slate-950">{item.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {page.useCases?.length ? (
              <div className="mt-8 rounded-[30px] border border-slate-200 bg-[linear-gradient(135deg,#f8fafc,#fff7ed)] p-6 sm:p-8">
                <div className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">
                  Aplicações comuns
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {page.useCases.map((item) => (
                    <div key={item} className="rounded-2xl bg-white px-4 py-4 text-sm font-black text-slate-800 shadow-sm">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      )}

      <section className="bg-[#f8fafc] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1600px]">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">
                Produtos relacionados
              </div>
              <h2 className="mt-2 text-2xl font-black uppercase text-slate-950 sm:text-3xl">
                Itens para {page.productType.toLowerCase()}
              </h2>
            </div>
            <Link
              href={page.catalogHref || `/produtos?busca=${encodeURIComponent(page.busca)}`}
              className="rounded-2xl border border-primary px-5 py-3 text-center text-sm font-black uppercase tracking-wide text-primary transition hover:bg-red-50"
            >
              Abrir catálogo completo
            </Link>
          </div>

          {produtos.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {produtos.slice(0, 12).map((produto) => (
                <ProductCard
                  key={produto.id}
                  produto={produto}
                  ocultarPreco={Number(produto.secao || 0) === 6}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <h3 className="text-xl font-black uppercase text-slate-900">
                Consulte essa linha pelo WhatsApp
              </h3>
              <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">
                Caso os produtos não apareçam agora, a equipe comercial confirma estoque, medidas e alternativas.
              </p>
            </div>
          )}
        </div>
      </section>

      {page.faqs?.length ? (
        <section className="bg-white px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">
              Dúvidas rápidas
            </div>
            <h2 className="mt-2 text-3xl font-black uppercase text-slate-950">
              Perguntas sobre telha sanduíche
            </h2>
            <div className="mt-6 grid gap-4">
              {page.faqs.map((item) => (
                <details key={item.question} className="group rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <summary className="cursor-pointer text-base font-black text-slate-950">
                    {item.question}
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  )
}
