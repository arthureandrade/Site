const STORAGE_KEY = 'galpao_personalizacao_v1'
const VISITOR_COOKIE = 'galpao_vid'
const MAX_VIEWED = 30
const MAX_SEARCHES = 20
const MAX_CLICKED = 60

function canUseBrowserStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function createVisitorId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `vid_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

export function ensureVisitorId() {
  if (typeof document === 'undefined') return ''

  const cookie = document.cookie
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${VISITOR_COOKIE}=`))

  if (cookie) return decodeURIComponent(cookie.split('=').slice(1).join('='))

  const visitorId = createVisitorId()
  document.cookie = `${VISITOR_COOKIE}=${encodeURIComponent(visitorId)}; Max-Age=31536000; Path=/; SameSite=Lax`
  return visitorId
}

function emptyProfile() {
  return {
    visitorId: '',
    viewed: [],
    searches: [],
    categories: {},
    cartIds: [],
    clickedIds: [],
    updatedAt: Date.now(),
  }
}

export function readPersonalizationProfile() {
  if (!canUseBrowserStorage()) return emptyProfile()

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    const parsed = saved ? JSON.parse(saved) : {}
    return {
      ...emptyProfile(),
      ...parsed,
      visitorId: parsed.visitorId || ensureVisitorId(),
      viewed: Array.isArray(parsed.viewed) ? parsed.viewed : [],
      searches: Array.isArray(parsed.searches) ? parsed.searches : [],
      categories: parsed.categories && typeof parsed.categories === 'object' ? parsed.categories : {},
      cartIds: Array.isArray(parsed.cartIds) ? parsed.cartIds : [],
      clickedIds: Array.isArray(parsed.clickedIds) ? parsed.clickedIds : [],
    }
  } catch {
    return { ...emptyProfile(), visitorId: ensureVisitorId() }
  }
}

function saveProfile(profile) {
  if (!canUseBrowserStorage()) return

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...profile,
        visitorId: profile.visitorId || ensureVisitorId(),
        updatedAt: Date.now(),
      })
    )
  } catch {}
}

function compactProduct(produto) {
  return {
    id: Number(produto?.id || 0),
    nome: produto?.nome || '',
    marca: produto?.marca || '',
    grupo: Number(produto?.grupo || 0),
    grupo_nome: produto?.grupo_nome || '',
    secao: Number(produto?.secao || 0),
    subgrupo: Number(produto?.subgrupo || 0),
    preco: Number(produto?.preco || 0),
    estoque: Number(produto?.estoque || 0),
    foto_url: produto?.foto_url || null,
    fallback_foto_url: produto?.fallback_foto_url || null,
    viewedAt: Date.now(),
  }
}

function categoryKeyFromProduct(produto) {
  return produto?.grupo_nome || produto?.grupo || produto?.marca || ''
}

function incrementCategory(profile, produto, weight = 1) {
  const key = String(categoryKeyFromProduct(produto) || '').trim()
  if (!key) return
  profile.categories[key] = Number(profile.categories[key] || 0) + weight
}

export function trackProductView(produto) {
  if (!produto?.id || !canUseBrowserStorage()) return

  const profile = readPersonalizationProfile()
  const compact = compactProduct(produto)
  profile.viewed = [
    compact,
    ...profile.viewed.filter((item) => Number(item?.id || 0) !== compact.id),
  ].slice(0, MAX_VIEWED)
  incrementCategory(profile, produto, 2)
  saveProfile(profile)
}

export function trackProductClick(produto) {
  if (!produto?.id || !canUseBrowserStorage()) return

  const profile = readPersonalizationProfile()
  const id = Number(produto.id)
  profile.clickedIds = [id, ...profile.clickedIds.filter((item) => Number(item) !== id)].slice(0, MAX_CLICKED)
  incrementCategory(profile, produto, 2)
  saveProfile(profile)
}

export function trackSearch(term) {
  const search = String(term || '').trim()
  if (!search || !canUseBrowserStorage()) return

  const profile = readPersonalizationProfile()
  profile.searches = [
    { term: search, searchedAt: Date.now() },
    ...profile.searches.filter((item) => normalizeText(item?.term) !== normalizeText(search)),
  ].slice(0, MAX_SEARCHES)
  saveProfile(profile)
}

export function trackCategory(category) {
  const key = String(category || '').trim()
  if (!key || key === 'Todas' || !canUseBrowserStorage()) return

  const profile = readPersonalizationProfile()
  profile.categories[key] = Number(profile.categories[key] || 0) + 1
  saveProfile(profile)
}

export function trackCartAdd(produto) {
  if (!produto?.id || !canUseBrowserStorage()) return

  const profile = readPersonalizationProfile()
  const id = Number(produto.id)
  profile.cartIds = [id, ...profile.cartIds.filter((item) => Number(item) !== id)].slice(0, 40)
  incrementCategory(profile, produto, 3)
  saveProfile(profile)
}

export function syncCartItems(items = []) {
  if (!canUseBrowserStorage()) return

  const profile = readPersonalizationProfile()
  profile.cartIds = (items || [])
    .map((item) => Number(item?.id || 0))
    .filter(Boolean)
    .slice(0, 40)

  for (const item of items || []) {
    incrementCategory(profile, item, 1)
  }

  saveProfile(profile)
}

export function getTopPersonalizationCategories(profile, limit = 3) {
  return Object.entries(profile?.categories || {})
    .filter(([name]) => String(name || '').trim())
    .sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0) || a[0].localeCompare(b[0], 'pt-BR'))
    .slice(0, limit)
    .map(([name]) => name)
}

export function normalizePersonalizationText(value) {
  return normalizeText(value)
}
