const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:8000'

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
  if (fotoUrl.startsWith('http')) return fotoUrl
  return `${API_URL}${fotoUrl}`
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

  return (
    (await fetchJson(`/produtos?${qs}`, fetchOptions, { total: 0, produtos: [] })) ||
    { total: 0, produtos: [] }
  )
}

export async function getProdutosDestaque({ limit = 8, meses = 3, preco_min = 100 } = {}) {
  const qs = new URLSearchParams()
  qs.set('limit', limit)
  qs.set('meses', meses)
  qs.set('preco_min', preco_min)

  return (
    (await fetchJson(`/produtos/destaques?${qs}`, { next: { revalidate: 1800 } }, { total: 0, produtos: [] })) ||
    { total: 0, produtos: [] }
  )
}

export async function getProdutosCatalogoPorSubgrupo(subgrupo, { limit = 24, em_estoque = true, com_preco = false } = {}) {
  const qs = new URLSearchParams()
  qs.set('limit', limit)
  if (em_estoque != null) qs.set('em_estoque', em_estoque)
  if (com_preco != null) qs.set('com_preco', com_preco)

  return (
    (await fetchJson(`/produtos/subgrupo/${subgrupo}/catalogo?${qs}`, { next: { revalidate: 60 } }, { total: 0, produtos: [] })) ||
    { total: 0, produtos: [] }
  )
}

export async function getProduto(id) {
  return await fetchJson(`/produtos/${id}`, { next: { revalidate: 60 } }, null)
}

export async function getHomeConfig() {
  return (
    (await fetchJson('/home-config', { cache: 'no-store' }, null)) || {
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
