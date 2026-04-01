const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:8000'
const GITHUB_FALLBACK_URL =
  process.env.NEXT_PUBLIC_GITHUB_FALLBACK_URL?.replace(/\/$/, '') ||
  'https://raw.githubusercontent.com/arthureandrade/Site/main/fallback-data'

const FOTO_PREFIXO_MAP = [
  { prefixo: 'cantoneira', produtoIdFoto: 44 },
  { prefixo: 'metalon', produtoIdFoto: 149 },
  { prefixo: 'perfil u', produtoIdFoto: 13244 },
  { prefixo: 'perfil c', produtoIdFoto: 231 },
  { prefixo: 'vergalhao', produtoIdFoto: 295 },
  { prefixo: 'chapa plana', produtoIdFoto: 2012 },
]

function normalizarTexto(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function formatarPreco(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor ?? 0)
}

export function calcularParcela(valor, parcelas = 10) {
  const numero = Number(valor || 0)
  if (numero <= 0 || parcelas <= 0) return 0
  return numero / parcelas
}

export function formatarParcelamento(valor, parcelas = 10) {
  const parcela = calcularParcela(valor, parcelas)
  if (parcela <= 0) return ''
  return `${parcelas}x ${formatarPreco(parcela)}`
}

export function imagemUrl(fotoUrl) {
  if (!fotoUrl) return null
  const versao = `v=${new Date().toISOString().slice(0, 13)}`
  if (fotoUrl.startsWith('http')) return `${fotoUrl}${fotoUrl.includes('?') ? '&' : '?'}${versao}`
  return `${API_URL}${fotoUrl}${fotoUrl.includes('?') ? '&' : '?'}${versao}`
}

export function imagemUrlProduto(produto) {
  const nome = normalizarTexto(produto?.nome)
  const regra = FOTO_PREFIXO_MAP.find((item) => nome.startsWith(item.prefixo))
  if (regra) return `${API_URL}/fotos/${regra.produtoIdFoto}.jpg`
  return imagemUrl(produto?.foto_url)
}

async function fetchJson(path, init = {}, fallback = null) {
  try {
    const res = await fetch(`${API_URL}${path}`, init)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (e) {
    console.error(`[API] ${path}:`, e)
    return fallback
  }
}

async function fetchFallbackJson(file, { noStore = false, revalidate = 300 } = {}) {
  try {
    const init = noStore ? { cache: 'no-store' } : { next: { revalidate } }
    const res = await fetch(`${GITHUB_FALLBACK_URL}/${file}`, init)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (e) {
    console.error(`[FALLBACK] ${file}:`, e)
    return null
  }
}

function normalizarNumero(valor) {
  const numero = Number(valor ?? 0)
  return Number.isFinite(numero) ? numero : 0
}

function normalizarProdutoSnapshot(produto) {
  return {
    ...produto,
    id: normalizarNumero(produto?.id),
    secao: normalizarNumero(produto?.secao),
    grupo: normalizarNumero(produto?.grupo),
    subgrupo: normalizarNumero(produto?.subgrupo),
    preco: normalizarNumero(produto?.preco),
    estoque: normalizarNumero(produto?.estoque),
    faturamento_3m: normalizarNumero(produto?.faturamento_3m),
    quantidade_vendida_3m: normalizarNumero(produto?.quantidade_vendida_3m),
  }
}

async function getFallbackCatalogSnapshot({ noStore = false, revalidate = 300 } = {}) {
  const snapshot = await fetchFallbackJson('produtos-combinados.json', { noStore, revalidate })
  return (snapshot?.produtos || []).map(normalizarProdutoSnapshot)
}

function filtrarProdutosLocalmente(
  produtos,
  {
    busca,
    marca,
    secao,
    grupo,
    subgrupo,
    subgrupos,
    em_estoque,
    com_preco = true,
    skip = 0,
    limit = 24,
    todas_secoes,
  } = {}
) {
  let lista = [...(produtos || [])]

  if (!todas_secoes && secao == null) {
    lista = lista.filter((item) => Number(item?.secao || 0) === 5)
  }

  if (secao != null && secao !== '') {
    lista = lista.filter((item) => Number(item?.secao || 0) === Number(secao))
  }

  if (busca) {
    const buscaNorm = normalizarTexto(busca)
    lista = lista.filter((item) => {
      const nome = normalizarTexto(item?.nome)
      const descricao = normalizarTexto(item?.descricao)
      const codigo = String(item?.id || '')
      return nome.includes(buscaNorm) || descricao.includes(buscaNorm) || codigo.includes(buscaNorm)
    })
  }

  if (marca) {
    const marcaNorm = normalizarTexto(marca)
    lista = lista.filter((item) => normalizarTexto(item?.marca).includes(marcaNorm))
  }

  if (grupo != null && grupo !== '') {
    lista = lista.filter((item) => Number(item?.grupo || 0) === Number(grupo))
  }

  if (subgrupo != null && subgrupo !== '') {
    lista = lista.filter((item) => Number(item?.subgrupo || 0) === Number(subgrupo))
  } else if (subgrupos?.length) {
    const conjunto = new Set(subgrupos.map((item) => Number(item)))
    lista = lista.filter((item) => conjunto.has(Number(item?.subgrupo || 0)))
  }

  if (com_preco) {
    lista = lista.filter((item) => Number(item?.preco || 0) > 0)
  }

  if (em_estoque === true) {
    lista = lista.filter((item) => Number(item?.estoque || 0) > 0)
  } else if (em_estoque === false) {
    lista = lista.filter((item) => Number(item?.estoque || 0) === 0)
  }

  const total = lista.length
  const inicio = Math.max(0, Number(skip || 0))
  const fim = inicio + Math.max(1, Number(limit || 24))
  return { total, produtos: lista.slice(inicio, fim) }
}

export async function getProdutos({
  busca,
  marca,
  secao,
  grupo,
  subgrupo,
  subgrupos,
  em_estoque,
  com_preco = true,
  todas_secoes,
  skip = 0,
  limit = 24,
  noStore = false,
  revalidate = 60,
} = {}) {
  const qs = new URLSearchParams()
  if (busca) qs.set('busca', busca)
  if (marca) qs.set('marca', marca)
  if (secao != null && secao !== '') qs.set('secao', secao)
  if (grupo != null && grupo !== '') qs.set('grupo', grupo)
  if (subgrupo != null && subgrupo !== '') qs.set('subgrupo', subgrupo)
  if (subgrupos?.length) qs.set('subgrupos', subgrupos.join(','))
  if (em_estoque != null) qs.set('em_estoque', em_estoque)
  if (com_preco != null) qs.set('com_preco', com_preco)
  if (todas_secoes != null) qs.set('todas_secoes', todas_secoes)
  qs.set('skip', skip)
  qs.set('limit', limit)

  const fetchOptions = noStore ? { cache: 'no-store' } : { next: { revalidate } }
  const apiResult = await fetchJson(`/produtos?${qs}`, fetchOptions, null)
  if (apiResult) return apiResult

  const fallbackProdutos = await getFallbackCatalogSnapshot({ noStore, revalidate: 300 })
  return filtrarProdutosLocalmente(fallbackProdutos, {
    busca,
    marca,
    secao,
    grupo,
    subgrupo,
    subgrupos,
    em_estoque,
    com_preco,
    skip,
    limit,
    todas_secoes,
  })
}

export async function getProdutosDestaque({ limit = 8, meses = 3, preco_min = 100 } = {}) {
  const qs = new URLSearchParams()
  qs.set('limit', limit)
  qs.set('meses', meses)
  qs.set('preco_min', preco_min)

  const apiResult = await fetchJson(`/produtos/destaques?${qs}`, { next: { revalidate: 1800 } }, null)
  if (apiResult) return apiResult

  const fallbackProdutos = await getFallbackCatalogSnapshot({ revalidate: 300 })
  const filtrados = fallbackProdutos
    .filter((item) => Number(item?.preco || 0) >= Number(preco_min || 0) && Number(item?.estoque || 0) > 0)
    .sort(
      (a, b) =>
        Number(b?.faturamento_3m || 0) - Number(a?.faturamento_3m || 0) ||
        Number(b?.quantidade_vendida_3m || 0) - Number(a?.quantidade_vendida_3m || 0) ||
        Number(b?.preco || 0) - Number(a?.preco || 0)
    )

  return { total: filtrados.length, produtos: filtrados.slice(0, limit) }
}

export async function getProdutosCatalogoPorSubgrupo(subgrupo, { limit = 24, em_estoque = true, com_preco = false } = {}) {
  const qs = new URLSearchParams()
  qs.set('limit', limit)
  if (em_estoque != null) qs.set('em_estoque', em_estoque)
  if (com_preco != null) qs.set('com_preco', com_preco)

  const apiResult = await fetchJson(`/produtos/subgrupo/${subgrupo}/catalogo?${qs}`, { next: { revalidate: 60 } }, null)
  if (apiResult) return apiResult

  const fallbackProdutos = await getFallbackCatalogSnapshot({ revalidate: 300 })
  return filtrarProdutosLocalmente(fallbackProdutos, {
    subgrupo,
    em_estoque,
    com_preco,
    limit,
    skip: 0,
    todas_secoes: true,
  })
}

export async function getProduto(id) {
  const apiResult = await fetchJson(`/produtos/${id}`, { next: { revalidate: 60 } }, null)
  if (apiResult) return apiResult

  const fallbackProdutos = await getFallbackCatalogSnapshot({ revalidate: 300 })
  return fallbackProdutos.find((item) => Number(item?.id || 0) === Number(id)) || null
}

export async function getHomeConfig() {
  const apiResult = await fetchJson('/home-config', { cache: 'no-store' }, null)
  if (apiResult) return apiResult

  const fallback = await fetchFallbackJson('home-config.json', { noStore: true })
  return (
    fallback?.data || {
      hero_image_url: null,
      hero_images: [],
      logo_url: null,
      hero_title: 'Ofertas em aco para sua obra',
      hero_subtitle: 'Estoque real, preco atualizado e atendimento rapido no WhatsApp.',
      sections: {},
    }
  )
}

export async function adminLogin(password) {
  return await fetchJson(
    '/admin/login',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    },
    null
  )
}

export async function vendedorLogin(login, senha) {
  return await fetchJson(
    '/vendedor/login',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, senha }),
    },
    null
  )
}

export async function vendedorSolicitarCadastro({ nome, login, senha }) {
  return await fetchJson(
    '/vendedor/cadastro',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, login, senha }),
    },
    null
  )
}

export async function vendedorListarSolicitacoes(password) {
  return await fetchJson(
    '/vendedor/solicitacoes',
    {
      headers: { 'X-Vendedor-Admin': password },
      cache: 'no-store',
    },
    null
  )
}

export async function vendedorAprovarSolicitacao(password, login) {
  return await fetchJson(
    `/vendedor/solicitacoes/${encodeURIComponent(login)}/aprovar`,
    {
      method: 'POST',
      headers: { 'X-Vendedor-Admin': password },
    },
    null
  )
}

export async function vendedorRejeitarSolicitacao(password, login) {
  return await fetchJson(
    `/vendedor/solicitacoes/${encodeURIComponent(login)}/rejeitar`,
    {
      method: 'POST',
      headers: { 'X-Vendedor-Admin': password },
    },
    null
  )
}

export async function getAdminHomeConfig(password) {
  return await fetchJson(
    '/admin/home-config',
    {
      headers: { 'X-Admin-Password': password },
      cache: 'no-store',
    },
    null
  )
}

export async function salvarSecaoHome(password, sectionKey, items) {
  return await fetchJson(
    `/admin/home-config/sections/${sectionKey}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Password': password,
      },
      body: JSON.stringify({ items }),
    },
    null
  )
}

export async function uploadAssetHome(password, assetKey, file) {
  const formData = new FormData()
  formData.append('arquivo', file)

  return await fetchJson(
    `/admin/home-config/assets/${assetKey}`,
    {
      method: 'POST',
      headers: {
        'X-Admin-Password': password,
      },
      body: formData,
    },
    null
  )
}

export function whatsappLink(nome, preco) {
  const numero = process.env.NEXT_PUBLIC_WHATSAPP || '559532240115'
  const msg = `Ola! Tenho interesse no produto *${nome}* - ${formatarPreco(preco)}. Poderia me passar mais informacoes?`
  return `https://wa.me/${numero}?text=${encodeURIComponent(msg)}`
}

export { API_URL }
