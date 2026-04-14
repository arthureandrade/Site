const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:8000'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const candidates = [
      `${API_URL}/fotos/logofundo.png`,
      `${API_URL}/api/fotos/logofundo.png`,
      `${API_URL}/fotos/logofundo.jpg`,
      `${API_URL}/api/fotos/logofundo.jpg`,
      `${API_URL}/fotos/logofundo.jpeg`,
      `${API_URL}/api/fotos/logofundo.jpeg`,
    ]

    for (const candidate of candidates) {
      const response = await fetch(candidate, { cache: 'no-store' }).catch(() => null)
      if (!response?.ok) continue
      const buffer = await response.arrayBuffer()
      return new Response(buffer, {
        headers: {
          'Content-Type': response.headers.get('content-type') || 'image/png',
          'Cache-Control': 'no-store',
        },
      })
    }
  } catch {
    return new Response('Logo nao encontrada.', { status: 404 })
  }

  return Response.redirect(new URL('/logo.jpeg', API_URL.startsWith('http') ? API_URL : 'https://www.galpaodoaco.com'), 302)
}
