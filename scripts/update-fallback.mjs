import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = join(__dirname, '..')
const OUTPUT_DIR = join(ROOT_DIR, 'fallback-data')
const API_BASE = (process.env.FALLBACK_SOURCE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://vendas.galpaodoaco.com/api').replace(/\/$/, '')

async function fetchJson(path) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'galpaodoaco-fallback-sync/1.0',
    },
  })

  if (!response.ok) {
    throw new Error(`Falha ao buscar ${path}: HTTP ${response.status}`)
  }

  return response.json()
}

async function writeIfChanged(filePath, data) {
  const nextContent = `${JSON.stringify(data, null, 2)}\n`
  let currentContent = null
  try {
    currentContent = await readFile(filePath, 'utf8')
  } catch {}

  if (currentContent === nextContent) {
    return false
  }

  await writeFile(filePath, nextContent, 'utf8')
  return true
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true })

  const [homeConfig, secao5, secao6] = await Promise.all([
    fetchJson('/home-config'),
    fetchJson('/produtos?secao=5&skip=0&limit=5000&com_preco=false'),
    fetchJson('/produtos?secao=6&skip=0&limit=5000&com_preco=false'),
  ])

  const combinadosMap = new Map()
  for (const produto of [...(secao5?.produtos || []), ...(secao6?.produtos || [])]) {
    if (!produto?.id) continue
    combinadosMap.set(Number(produto.id), produto)
  }

  const generatedAt = new Date().toISOString()

  const snapshotHome = {
    generated_at: generatedAt,
    source_api: API_BASE,
    data: homeConfig,
  }

  const snapshotSecao5 = {
    generated_at: generatedAt,
    source_api: API_BASE,
    total: Number(secao5?.total || (secao5?.produtos || []).length || 0),
    produtos: secao5?.produtos || [],
  }

  const snapshotSecao6 = {
    generated_at: generatedAt,
    source_api: API_BASE,
    total: Number(secao6?.total || (secao6?.produtos || []).length || 0),
    produtos: secao6?.produtos || [],
  }

  const snapshotCombinado = {
    generated_at: generatedAt,
    source_api: API_BASE,
    total: combinadosMap.size,
    produtos: Array.from(combinadosMap.values()),
  }

  const changed = await Promise.all([
    writeIfChanged(join(OUTPUT_DIR, 'home-config.json'), snapshotHome),
    writeIfChanged(join(OUTPUT_DIR, 'produtos-secao-5.json'), snapshotSecao5),
    writeIfChanged(join(OUTPUT_DIR, 'produtos-secao-6.json'), snapshotSecao6),
    writeIfChanged(join(OUTPUT_DIR, 'produtos-combinados.json'), snapshotCombinado),
  ])

  console.log(
    JSON.stringify(
      {
        api: API_BASE,
        generated_at: generatedAt,
        secao_5: snapshotSecao5.total,
        secao_6: snapshotSecao6.total,
        combinados: snapshotCombinado.total,
        changed: changed.some(Boolean),
      },
      null,
      2
    )
  )
}

main().catch((error) => {
  console.error('[fallback-sync] erro fatal:', error)
  process.exit(1)
})
