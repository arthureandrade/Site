import { copyFile, mkdir, readdir } from 'node:fs/promises'
import { extname, join } from 'node:path'

const ROOT_DIR = process.cwd()
const SOURCE_DIR = join(ROOT_DIR, 'heros')
const OUTPUT_DIR = join(ROOT_DIR, 'public', 'hero-assets')
const ALLOWED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp'])
const ALLOWED_NAMES = new Set(['hero1', 'hero2', 'hero3', 'hero4', 'back'])

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true })

  const files = await readdir(SOURCE_DIR)
  const copied = []

  for (const file of files) {
    const extension = extname(file).toLowerCase()
    const name = file.slice(0, -extension.length).toLowerCase()

    if (!ALLOWED_EXTENSIONS.has(extension) || !ALLOWED_NAMES.has(name)) continue

    await copyFile(join(SOURCE_DIR, file), join(OUTPUT_DIR, `${name}${extension}`))
    copied.push(`${name}${extension}`)
  }

  console.log(
    copied.length
      ? `Hero assets sincronizados: ${copied.join(', ')}`
      : 'Nenhum hero asset encontrado para sincronizar.'
  )
}

main().catch((error) => {
  console.error('Falha ao sincronizar hero assets:', error)
  process.exit(1)
})
