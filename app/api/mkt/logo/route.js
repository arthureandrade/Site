import path from 'path'
import { readFile } from 'fs/promises'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const LOGO_PATH = path.join('C:', 'Users', 'Arthur Andrade', 'Documents', 'agente01', 'Projeto1claude', 'api_produtos', 'fotos', 'logofundo.png')

export async function GET() {
  try {
    const buffer = await readFile(LOGO_PATH)
    return new Response(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return new Response('Logo nao encontrada.', { status: 404 })
  }
}
