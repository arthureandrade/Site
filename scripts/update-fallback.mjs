import { createHash } from 'node:crypto'
import { access, mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = join(__dirname, '..')
const OUTPUT_DIR = join(ROOT_DIR, 'fallback-data')
const OUTPUT_FOTOS_DIR = join(OUTPUT_DIR, 'fotos')
const PHOTO_MANIFEST_PATH = join(OUTPUT_DIR, 'foto-manifest.json')
const API_BASE = (
  process.env.FALLBACK_SOURCE_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://vendas.galpaodoaco.com/api'
).replace(/\/$/, '')
const FALLBACK_PUBLIC_BASE = (
  process.env.FALLBACK_PUBLIC_BASE ||
  'https://raw.githubusercontent.com/arthureandrade/Site/main/fallback-data'
).replace(/\/$/, '')
const PAGE_SIZE = Math.min(10000, Math.max(100, Number(process.env.FALLBACK_PAGE_SIZE || 5000)))
const MAX_PAGES = Math.max(1, Number(process.env.FALLBACK_MAX_PAGES || 20))
const MAX_FOTOS_POR_EXECUCAO = Math.max(0, Number(process.env.FALLBACK_MAX_FOTOS || 500))
const MIN_CATALOG_RATIO = Math.min(
  1,
  Math.max(0.1, Number(process.env.FALLBACK_MIN_CATALOG_RATIO || 0.85))
)

async function fetchJson(path) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'galpaodoaco-fallback-sync/3.0',
    },
    signal: AbortSignal.timeout(60000),
  })

  if (!response.ok) {
    throw new Error(`Falha ao buscar ${path}: HTTP ${response.status}`)
  }

  return response.json()
}

async function fileExists(filePath) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function atomicWrite(filePath, content) {
  const tempPath = `${filePath}.${process.pid}.tmp`
  await writeFile(tempPath, content)
  await rename(tempPath, filePath)
}

async function writeIfChanged(filePath, data) {
  const nextContent = `${JSON.stringify(data, null, 2)}\n`
  let currentContent = null
  try {
    currentContent = await readFile(filePath, 'utf8')
  } catch {}

  if (currentContent === nextContent) return false

  await atomicWrite(filePath, nextContent)
  return true
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'))
  } catch {
    return fallback
  }
}

function versionFromBuffer(buffer) {
  return createHash('sha256').update(buffer).digest('hex').slice(0, 16)
}

async function fetchTodosProdutos() {
  const produtosMap = new Map()
  let totalInformado = null
  let terminou = false

  for (let pagina = 0; pagina < MAX_PAGES; pagina += 1) {
    const skip = pagina * PAGE_SIZE
    const resposta = await fetchJson(
      `/produtos?todas_secoes=1&skip=${skip}&limit=${PAGE_SIZE}&com_preco=false`
    )
    const lote = Array.isArray(resposta?.produtos) ? resposta.produtos : []

    if (totalInformado == null) totalInformado = Number(resposta?.total || 0)

    for (const produto of lote) {
      const id = Number(produto?.id || 0)
      if (!id) continue
      produtosMap.set(id, produto)
    }

    console.log(
      `[fallback-sync] pagina=${pagina + 1} skip=${skip} recebidos=${lote.length} ` +
        `unicos=${produtosMap.size} total=${totalInformado}`
    )

    if (lote.length < PAGE_SIZE || (totalInformado > 0 && skip + lote.length >= totalInformado)) {
      terminou = true
      break
    }
  }

  if (!terminou) {
    throw new Error(`Fallback excedeu o limite de ${MAX_PAGES} paginas.`)
  }
  if (totalInformado > 0 && produtosMap.size < totalInformado) {
    throw new Error(
      `Fallback incompleto: API informou ${totalInformado}, mas foram carregados ${produtosMap.size}.`
    )
  }
  if (produtosMap.size === 0) {
    throw new Error('Fallback vazio: nenhum produto foi retornado pela API.')
  }

  return {
    totalInformado,
    produtos: Array.from(produtosMap.values()),
  }
}

async function validarContraSnapshotAnterior(produtos) {
  const anterior = await readJson(join(OUTPUT_DIR, 'produtos-combinados.json'), null)
  const totalAnterior = Array.isArray(anterior?.produtos)
    ? anterior.produtos.length
    : Number(anterior?.total || 0)

  if (totalAnterior > 0 && produtos.length < totalAnterior * MIN_CATALOG_RATIO) {
    throw new Error(
      `Catalogo encolheu de ${totalAnterior} para ${produtos.length}. ` +
        'Snapshot anterior preservado para evitar publicar uma base parcial.'
    )
  }
}

async function carregarManifestoFotos() {
  const manifesto = await readJson(PHOTO_MANIFEST_PATH, {})
  return {
    schema_version: 2,
    cursor: Math.max(0, Number(manifesto?.cursor || 0)),
    fotos: manifesto?.fotos && typeof manifesto.fotos === 'object' ? manifesto.fotos : {},
  }
}

async function idsFotosLocais() {
  const nomes = await readdir(OUTPUT_FOTOS_DIR)
  return new Set(
    nomes
      .map((nome) => String(nome).match(/^(\d+)\.jpg$/i)?.[1])
      .filter(Boolean)
      .map(Number)
  )
}

async function garantirVersoesLocais(ids, manifesto) {
  const semVersao = ids.filter((id) => !manifesto.fotos[String(id)]?.version)
  let indice = 0

  async function worker() {
    while (indice < semVersao.length) {
      const id = semVersao[indice++]
      const caminho = join(OUTPUT_FOTOS_DIR, `${id}.jpg`)
      try {
        const buffer = await readFile(caminho)
        manifesto.fotos[String(id)] = {
          ...(manifesto.fotos[String(id)] || {}),
          version: versionFromBuffer(buffer),
        }
      } catch {}
    }
  }

  await Promise.all(Array.from({ length: Math.min(12, Math.max(semVersao.length, 1)) }, () => worker()))
}

function montarCandidatosFotos(produtos) {
  const candidatos = new Map()
  for (const produto of produtos) {
    const id = Number(produto?.id || 0)
    const fotoUrl = String(produto?.foto_url || '').trim()
    if (!id || !fotoUrl) continue
    candidatos.set(id, {
      id,
      sourceUrl: fotoUrl.startsWith('http') ? fotoUrl : `${API_BASE}${fotoUrl}`,
    })
  }
  return Array.from(candidatos.values()).sort((a, b) => a.id - b.id)
}

async function sincronizarFoto(candidato, manifesto, idsLocais) {
  const chave = String(candidato.id)
  const registro = manifesto.fotos[chave] || {}
  const headers = {
    Accept: 'image/*',
    'User-Agent': 'galpaodoaco-fallback-sync/3.0',
  }
  if (registro.etag) headers['If-None-Match'] = registro.etag
  if (registro.last_modified) headers['If-Modified-Since'] = registro.last_modified

  try {
    const response = await fetch(candidato.sourceUrl, {
      headers,
      signal: AbortSignal.timeout(20000),
    })

    if (response.status === 304) return { verificada: true, alterada: false }
    if (!response.ok) return { verificada: false, alterada: false }

    const contentType = String(response.headers.get('content-type') || '').toLowerCase()
    if (!contentType.startsWith('image/')) return { verificada: false, alterada: false }

    const buffer = Buffer.from(await response.arrayBuffer())
    if (buffer.length < 100) return { verificada: false, alterada: false }

    const version = versionFromBuffer(buffer)
    const alterada = !idsLocais.has(candidato.id) || version !== registro.version
    if (alterada) {
      await atomicWrite(join(OUTPUT_FOTOS_DIR, `${candidato.id}.jpg`), buffer)
      idsLocais.add(candidato.id)
    }

    manifesto.fotos[chave] = {
      source_url: candidato.sourceUrl,
      etag: response.headers.get('etag') || null,
      last_modified: response.headers.get('last-modified') || null,
      version,
    }
    return { verificada: true, alterada }
  } catch {
    return { verificada: false, alterada: false }
  }
}

function selecionarFotosParaSincronizar(candidatos, idsLocais, manifesto) {
  if (MAX_FOTOS_POR_EXECUCAO <= 0 || candidatos.length === 0) return []

  const faltantes = candidatos.filter((item) => !idsLocais.has(item.id))
  const existentes = candidatos.filter((item) => idsLocais.has(item.id))
  const limiteFaltantes = existentes.length
    ? Math.ceil(MAX_FOTOS_POR_EXECUCAO * 0.8)
    : MAX_FOTOS_POR_EXECUCAO
  const selecionadas = faltantes.slice(0, limiteFaltantes)
  const vagasRevisao = MAX_FOTOS_POR_EXECUCAO - selecionadas.length

  if (vagasRevisao > 0 && existentes.length > 0) {
    const inicio = manifesto.cursor % existentes.length
    for (let i = 0; i < Math.min(vagasRevisao, existentes.length); i += 1) {
      selecionadas.push(existentes[(inicio + i) % existentes.length])
    }
    manifesto.cursor = (inicio + Math.min(vagasRevisao, existentes.length)) % existentes.length
  }

  return selecionadas
}

async function sincronizarFotos(produtos) {
  const manifesto = await carregarManifestoFotos()
  const idsLocais = await idsFotosLocais()
  const candidatos = montarCandidatosFotos(produtos)
  const idsCandidatosLocais = candidatos.map((item) => item.id).filter((id) => idsLocais.has(id))
  await garantirVersoesLocais(idsCandidatosLocais, manifesto)

  const selecionadas = selecionarFotosParaSincronizar(candidatos, idsLocais, manifesto)
  let indice = 0
  let verificadas = 0
  let alteradas = 0

  async function worker() {
    while (indice < selecionadas.length) {
      const candidato = selecionadas[indice++]
      const resultado = await sincronizarFoto(candidato, manifesto, idsLocais)
      if (resultado.verificada) verificadas += 1
      if (resultado.alterada) alteradas += 1
    }
  }

  await Promise.all(Array.from({ length: Math.min(10, Math.max(selecionadas.length, 1)) }, () => worker()))
  await writeIfChanged(PHOTO_MANIFEST_PATH, manifesto)

  console.log(
    `[fallback-sync] fotos candidatas=${candidatos.length} selecionadas=${selecionadas.length} ` +
      `verificadas=${verificadas} alteradas=${alteradas} locais=${idsLocais.size}`
  )

  return { manifesto, idsLocais, verificadas, alteradas }
}

function enriquecerProdutosComFotos(produtos, manifesto, idsLocais) {
  return produtos.map((produto) => {
    const id = Number(produto?.id || 0)
    const temFotoAtual = Boolean(String(produto?.foto_url || '').trim())
    const registro = manifesto.fotos[String(id)] || {}
    const disponivel = temFotoAtual && idsLocais.has(id) && registro.version

    return {
      ...produto,
      fallback_foto_url: disponivel
        ? `${FALLBACK_PUBLIC_BASE}/fotos/${id}.jpg?v=${registro.version}`
        : null,
      fallback_foto_version: disponivel ? registro.version : null,
    }
  })
}

function ehRamassol(produto) {
  return String(produto?.marca || '').trim().toLowerCase().includes('ramassol')
}

function produtosDaSecao(produtos, secao) {
  return produtos.filter(
    (produto) => Number(produto?.secao || 0) === Number(secao) || ehRamassol(produto)
  )
}

function criarSnapshotProdutos(produtos, generatedAt, sourceTotal) {
  return {
    generated_at: generatedAt,
    source_api: API_BASE,
    source_total: sourceTotal,
    total: produtos.length,
    produtos,
  }
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true })
  await mkdir(OUTPUT_FOTOS_DIR, { recursive: true })

  const [homeConfig, catalogo] = await Promise.all([fetchJson('/home-config'), fetchTodosProdutos()])
  await validarContraSnapshotAnterior(catalogo.produtos)

  const fotos = await sincronizarFotos(catalogo.produtos)
  const produtosComFotos = enriquecerProdutosComFotos(
    catalogo.produtos,
    fotos.manifesto,
    fotos.idsLocais
  )
  const generatedAt = new Date().toISOString()
  const snapshotHome = {
    generated_at: generatedAt,
    source_api: API_BASE,
    data: homeConfig,
  }
  const snapshotCombinado = criarSnapshotProdutos(
    produtosComFotos,
    generatedAt,
    catalogo.totalInformado
  )
  const snapshotSecao5 = criarSnapshotProdutos(
    produtosDaSecao(produtosComFotos, 5),
    generatedAt,
    catalogo.totalInformado
  )
  const snapshotSecao6 = criarSnapshotProdutos(
    produtosDaSecao(produtosComFotos, 6),
    generatedAt,
    catalogo.totalInformado
  )
  const snapshotSecao14 = criarSnapshotProdutos(
    produtosDaSecao(produtosComFotos, 14),
    generatedAt,
    catalogo.totalInformado
  )

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
        catalogo_completo: snapshotCombinado.total,
        secao_5: snapshotSecao5.total,
        secao_6: snapshotSecao6.total,
        secao_14: snapshotSecao14.total,
        ramassol: produtosComFotos.filter(ehRamassol).length,
        fotos_verificadas: fotos.verificadas,
        fotos_alteradas: fotos.alteradas,
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
