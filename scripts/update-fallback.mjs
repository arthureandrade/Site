import { mkdir, readFile, writeFile, access } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = join(__dirname, '..')
const OUTPUT_DIR = join(ROOT_DIR, 'fallback-data')
const OUTPUT_FOTOS_DIR = join(OUTPUT_DIR, 'fotos')
const API_BASE = (process.env.FALLBACK_SOURCE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://vendas.galpaodoaco.com/api').replace(/\/$/, '')
const FALLBACK_PUBLIC_BASE = (process.env.FALLBACK_PUBLIC_BASE || 'https://raw.githubusercontent.com/arthureandrade/Site/main/fallback-data').replace(/\/$/, '')
const MAX_FOTOS_POR_EXECUCAO = Number(process.env.FALLBACK_MAX_FOTOS || 250)

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

async function fileExists(filePath) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function baixarFotoFallback(produto, estadoFotos) {
  const produtoId = Number(produto?.id || 0)
  const fotoUrl = String(produto?.foto_url || '').trim()
  if (!produtoId || !fotoUrl) return null

  const finalUrl = fotoUrl.startsWith('http') ? fotoUrl : `${API_BASE}${fotoUrl}`
  const caminho = join(OUTPUT_FOTOS_DIR, `${produtoId}.jpg`)
  const publicUrl = `${FALLBACK_PUBLIC_BASE}/fotos/${produtoId}.jpg`

  if (await fileExists(caminho)) {
    return publicUrl
  }

  if (estadoFotos.processadas >= estadoFotos.maximo) {
    return null
  }

  estadoFotos.processadas += 1

  if (!(await fileExists(caminho))) {
    try {
      const response = await fetch(finalUrl, {
        headers: {
          Accept: 'image/*',
          'User-Agent': 'galpaodoaco-fallback-sync/1.0',
        },
        signal: AbortSignal.timeout(15000),
      })
      if (!response.ok) {
        return null
      }
      const arrayBuffer = await response.arrayBuffer()
      await writeFile(caminho, Buffer.from(arrayBuffer))
    } catch {
      return null
    }
  }

  return publicUrl
}

async function enriquecerProdutosComFotos(produtos, concurrency = 8) {
  const lista = [...(produtos || [])]
  const saida = new Array(lista.length)
  let indiceAtual = 0
  const estadoFotos = { processadas: 0, maximo: MAX_FOTOS_POR_EXECUCAO }

  async function worker() {
    while (indiceAtual < lista.length) {
      const indice = indiceAtual++
      const produto = lista[indice]
      const fallback_foto_url = await baixarFotoFallback(produto, estadoFotos)
      saida[indice] = { ...produto, fallback_foto_url }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, Math.max(lista.length, 1)) }, () => worker())
  await Promise.all(workers)
  return saida
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true })
  await mkdir(OUTPUT_FOTOS_DIR, { recursive: true })

  const [homeConfig, secao5, secao6, secao14] = await Promise.all([
    fetchJson('/home-config'),
    fetchJson('/produtos?secao=5&skip=0&limit=5000&com_preco=false'),
    fetchJson('/produtos?secao=6&skip=0&limit=5000&com_preco=false'),
    fetchJson('/produtos?secao=14&skip=0&limit=5000&com_preco=false'),
  ])

  const combinadosMap = new Map()
  for (const produto of [...(secao5?.produtos || []), ...(secao14?.produtos || []), ...(secao6?.produtos || [])]) {
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

  const snapshotSecao14 = {
    generated_at: generatedAt,
    source_api: API_BASE,
    total: Number(secao14?.total || (secao14?.produtos || []).length || 0),
    produtos: secao14?.produtos || [],
  }

  const snapshotCombinado = {
    generated_at: generatedAt,
    source_api: API_BASE,
    total: combinadosMap.size,
    produtos: Array.from(combinadosMap.values()),
  }

  const produtosSecao5 = await enriquecerProdutosComFotos(snapshotSecao5.produtos)
  const produtosSecao6 = await enriquecerProdutosComFotos(snapshotSecao6.produtos)
  const produtosSecao14 = await enriquecerProdutosComFotos(snapshotSecao14.produtos)
  const produtosCombinados = await enriquecerProdutosComFotos(snapshotCombinado.produtos)

  snapshotSecao5.produtos = produtosSecao5
  snapshotSecao6.produtos = produtosSecao6
  snapshotSecao14.produtos = produtosSecao14
  snapshotCombinado.produtos = produtosCombinados

  const changed = await Promise.all([
    writeIfChanged(join(OUTPUT_DIR, 'home-config.json'), snapshotHome),
    writeIfChanged(join(OUTPUT_DIR, 'produtos-secao-5.json'), snapshotSecao5),
    writeIfChanged(join(OUTPUT_DIR, 'produtos-secao-6.json'), snapshotSecao6),
    writeIfChanged(join(OUTPUT_DIR, 'produtos-secao-14.json'), snapshotSecao14),
    writeIfChanged(join(OUTPUT_DIR, 'produtos-combinados.json'), snapshotCombinado),
  ])

  console.log(
    JSON.stringify(
      {
        api: API_BASE,
        generated_at: generatedAt,
        secao_5: snapshotSecao5.total,
        secao_14: snapshotSecao14.total,
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
