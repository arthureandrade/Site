import { absoluteSiteUrl } from '@/lib/seo'

export function GET() {
  const body = `User-agent: *
Allow: /

Sitemap: ${absoluteSiteUrl('/sitemap.xml')}
`

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
