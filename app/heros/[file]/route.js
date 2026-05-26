import fs from 'fs/promises'
import path from 'path'
import { NextResponse } from 'next/server'

const ALLOWED_FILES = new Set([
  'hero1.png',
  'hero1.jpg',
  'hero1.jpeg',
  'hero1.webp',
  'hero2.png',
  'hero2.jpg',
  'hero2.jpeg',
  'hero2.webp',
  'hero3.png',
  'hero3.jpg',
  'hero3.jpeg',
  'hero3.webp',
  'hero4.png',
  'hero4.jpg',
  'hero4.jpeg',
  'hero4.webp',
])

const CONTENT_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
}

export const dynamic = 'force-dynamic'

export async function GET(_request, { params }) {
  const file = String(params?.file || '').toLowerCase()
  if (!ALLOWED_FILES.has(file)) {
    return new NextResponse('Imagem nao encontrada', { status: 404 })
  }

  const filePath = path.join(process.cwd(), 'heros', file)
  const extension = path.extname(file)

  try {
    const image = await fs.readFile(filePath)
    return new NextResponse(image, {
      headers: {
        'Content-Type': CONTENT_TYPES[extension] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
    })
  } catch {
    return new NextResponse('Imagem nao encontrada', { status: 404 })
  }
}
