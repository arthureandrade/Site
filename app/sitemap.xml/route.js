import { getProdutos } from '@/lib/api'
import { absoluteSiteUrl } from '@/lib/seo'
import { SEO_LANDING_PAGES } from '@/lib/seoLandingPages'

export const dynamic = 'force-dynamic'
export const revalidate = 1800

function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function urlEntry(loc, { priority = '0.7', changefreq = 'daily' } = {}) {
  return `
  <url>
    <loc>${escapeXml(loc)}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
}

export async function GET() {
  const [secao5, secao14, secao6] = await Promise.all([
    getProdutos({ secao: 5, com_preco: true, todas_secoes: false, limit: 5000, revalidate: 1800 }),
    getProdutos({ secao: 14, com_preco: true, todas_secoes: false, limit: 5000, revalidate: 1800 }),
    getProdutos({ secao: 6, com_preco: false, todas_secoes: false, limit: 5000, revalidate: 1800 }),
  ])

  const productMap = new Map()
  for (const produto of [
    ...(secao5?.produtos || []),
    ...(secao14?.produtos || []),
    ...(secao6?.produtos || []),
  ]) {
    if (!produto?.id) continue
    productMap.set(Number(produto.id), produto)
  }

  const urls = [
    urlEntry(absoluteSiteUrl('/'), { priority: '1.0' }),
    urlEntry(absoluteSiteUrl('/produtos'), { priority: '0.9' }),
    urlEntry(absoluteSiteUrl('/produtos?categoria=ferro_aco'), { priority: '0.8' }),
    urlEntry(absoluteSiteUrl('/politica-de-troca-e-devolucao'), { priority: '0.5', changefreq: 'monthly' }),
    urlEntry(absoluteSiteUrl('/feed-meta.csv'), { priority: '0.4', changefreq: 'hourly' }),
    urlEntry(absoluteSiteUrl('/feed-google.tsv'), { priority: '0.4', changefreq: 'hourly' }),
    ...SEO_LANDING_PAGES.map((page) => urlEntry(absoluteSiteUrl(`/${page.slug}`), { priority: '0.85' })),
    ...Array.from(productMap.values()).map((produto) =>
      urlEntry(absoluteSiteUrl(`/produto/${encodeURIComponent(produto.id)}`), { priority: '0.65' })
    ),
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
    },
  })
}
