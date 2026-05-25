import { loadMetaFeedProducts, productsToMetaCsv } from '@/lib/metaFeed'

export const dynamic = 'force-dynamic'
export const revalidate = 1800

export async function GET() {
  const products = await loadMetaFeedProducts()
  const csv = productsToMetaCsv(products)

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'inline; filename="feed-meta.csv"',
      'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=1800',
    },
  })
}
