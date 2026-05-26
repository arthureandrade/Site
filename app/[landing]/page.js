import Link from 'next/link'
import { notFound } from 'next/navigation'
import CatalogViewTracker from '@/components/CatalogViewTracker'
import ProductCard from '@/components/ProductCard'
import TrackedWhatsAppLink from '@/components/TrackedWhatsAppLink'
import { getProdutos } from '@/lib/api'
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
  const itemListJsonLd = buildCatalogItemListJsonLd(produtos)
  const whatsappHref = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
    `Olá! Quero orçamento para ${page.categoryName}.`
  )}`

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
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
    </>
  )
}
