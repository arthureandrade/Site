import { loadGoogleFeedProducts, productsToGoogleTsv } from '@/lib/googleFeed'

export const dynamic = 'force-dynamic'
export const revalidate = 1800

export async function GET() {
  const products = await loadGoogleFeedProducts()
  const tsv = productsToGoogleTsv(products)

  return new Response(tsv, {
    status: 200,
    headers: {
      'Content-Type': 'text/tab-separated-values; charset=utf-8',
      'Content-Disposition': 'inline; filename="feed-google.tsv"',
      'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=1800',
    },
  })
}
