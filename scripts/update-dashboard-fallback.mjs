import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = join(__dirname, '..')
const OUTPUT_DIR = join(ROOT_DIR, 'fallback-data', 'dashboard')
const API_BASE = (process.env.DASHBOARD_SOURCE_API_URL || 'https://vendas.galpaodoaco.com').replace(/\/$/, '')

async function readJsonIfExists(filePath) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'))
  } catch {
    return null
  }
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

async function fetchDashboardSnapshot(endpoint, existing) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'galpaodoaco-dashboard-fallback/1.0',
      },
      signal: AbortSignal.timeout(20000),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`[dashboard-fallback] mantendo snapshot atual para ${endpoint}:`, error.message)
    return (
      existing || {
        ok: false,
        generated_at: new Date().toISOString(),
        erro: `Falha ao atualizar snapshot: ${error.message}`,
      }
    )
  }
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true })

  const targets = [
    { file: 'vendas.json', endpoint: '/api/dashboard-static/vendas' },
    { file: 'cobranca.json', endpoint: '/api/dashboard-static/cobranca' },
    { file: 'contas-pagar.json', endpoint: '/api/dashboard-static/contas-pagar' },
  ]

  const resultados = []
  for (const target of targets) {
    const filePath = join(OUTPUT_DIR, target.file)
    const existing = await readJsonIfExists(filePath)
    const data = await fetchDashboardSnapshot(target.endpoint, existing)
    const changed = await writeIfChanged(filePath, data)
    resultados.push({ file: target.file, changed, ok: !!data?.ok })
  }

  await writeIfChanged(
    join(OUTPUT_DIR, 'index.json'),
    {
      generated_at: new Date().toISOString(),
      source_api: API_BASE,
      arquivos: resultados,
    }
  )

  console.log(JSON.stringify({ api: API_BASE, resultados }, null, 2))
}

main().catch((error) => {
  console.error('[dashboard-fallback] erro fatal:', error)
  process.exit(1)
})
