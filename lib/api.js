const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:8000'

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

export async function getProdutos({ busca, marca, secao, em_estoque, com_preco = true, todas_secoes, skip = 0, limit = 24 } = {}) {
  const qs = new URLSearchParams()
  if (busca) qs.set('busca', busca)
  if (marca) qs.set('marca', marca)
  if (secao != null && secao !== '') qs.set('secao', secao)
  if (em_estoque != null) qs.set('em_estoque', em_estoque)
  if (com_preco != null) qs.set('com_preco', com_preco)
  if (todas_secoes != null) qs.set('todas_secoes', todas_secoes)
  qs.set('skip', skip)
  qs.set('limit', limit)

  return (
    (await fetchJson(`/produtos?${qs}`, { next: { revalidate: 60 } }, { total: 0, produtos: [] })) ||
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

export async function getProduto(id) {
  return await fetchJson(`/produtos/${id}`, { next: { revalidate: 60 } }, null)
}

export async function getHomeConfig() {
  return (
    (await fetchJson('/home-config', { cache: 'no-store' }, null)) || {
      hero_image_url: null,
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
