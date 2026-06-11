import { loadGoogleFeedProducts, productsToGoogleTsv } from '@/lib/googleFeed'
import { LONG_PUBLIC_CACHE_SECONDS } from '@/lib/cacheConfig'

export const dynamic = 'force-static'
export const revalidate = 1800

export async function GET() {
  const products = await loadGoogleFeedProducts()
  const tsv = productsToGoogleTsv(products)

  return new Response(tsv, {
    status: 200,
    headers: {
      'Content-Type': 'text/tab-separated-values; charset=utf-8',
      'Content-Disposition': 'inline; filename="feed-google.tsv"',
      'Cache-Control': `public, s-maxage=${LONG_PUBLIC_CACHE_SECONDS}, stale-while-revalidate=${LONG_PUBLIC_CACHE_SECONDS}`,
    },
  })
}
