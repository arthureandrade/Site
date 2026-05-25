import { getCatalogoCompletoComFallback } from '@/lib/api'
import { calcularPrecoPromocional, obterDescontoPromocional } from '@/lib/ofertas'

export const META_FEED_BASE_URL = 'https://galpaodoaco.com'
export const META_FEED_BRAND = 'Galpão do Aço'
export const META_FEED_GOOGLE_CATEGORY = 'Hardware > Building Materials'

export const META_FEED_HEADERS = [
  'id',
  'title',
  'description',
  'availability',
  'condition',
  'price',
  'link',
  'image_link',
  'brand',
  'inventory',
  'google_product_category',
  'product_type',
  'sale_price',
  'additional_image_link',
  'custom_label_0',
  'custom_label_1',
  'custom_label_2',
]

export const MOCK_META_PRODUCTS = [
  {
    id: 'TELHA-GALV-043',
    title: 'Telha Galvalume 0,43mm',
    description: 'Telha galvalume 0,43mm pronta entrega em Boa Vista RR',
    price: 49.9,
    salePrice: 44.9,
    stock: 120,
    active: true,
    hidden: false,
    brand: META_FEED_BRAND,
    productType: 'Telhas',
    category: META_FEED_GOOGLE_CATEGORY,
    slug: 'telha-galvalume-043',
    image: '/images/produtos/telha-galvalume-043.jpg',
    additionalImages: ['/images/produtos/telha-galvalume-043-2.jpg'],
    labels: ['Telhas', 'Pronta entrega', 'Promoção'],
  },
]

function stripHtml(value) {
  return String(value ?? '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
}

function cleanText(value, { maxLength } = {}) {
  const text = stripHtml(value)
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!maxLength || text.length <= maxLength) return text
  return text.slice(0, maxLength).trim()
}

function normalizeNumber(value) {
  const number = Number(value ?? 0)
  return Number.isFinite(number) ? number : 0
}

export function formatMetaPrice(value) {
  const number = normalizeNumber(value)
  if (number <= 0) return ''
  return `${number.toFixed(2)} BRL`
}

export function escapeCsvField(value) {
  const text = String(value ?? '').replace(/[\r\n]+/g, ' ').replace(/"/g, '""')
  if (/[",\n\r]/.test(text)) return `"${text}"`
  return text
}

export function normalizeImageUrl(imagePath) {
  if (!imagePath) return ''

  const raw = String(imagePath).trim()
  if (!raw) return ''

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw
  }

  if (raw.startsWith('/')) {
    return `${META_FEED_BASE_URL}${raw}`
  }

  return `${META_FEED_BASE_URL}/${raw}`
}

export function normalizeProductUrl(product) {
  const slugOrId = product?.slug || product?.id || product?.sku
  if (!slugOrId) return ''
  return `${META_FEED_BASE_URL}/produto/${encodeURIComponent(String(slugOrId))}`
}

function isPublicUrl(value) {
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) && Boolean(url.hostname)
  } catch {
    return false
  }
}

export function isPublicImageUrl(value) {
  if (!isPublicUrl(value)) return false
  const pathname = new URL(value).pathname.toLowerCase()
  return /\.(jpe?g|png|webp|gif)$/.test(pathname)
}

function normalizeAdditionalImages(product) {
  const images = product?.additionalImages || product?.additional_images || product?.imagens || []
  if (!Array.isArray(images)) return ''

  return images
    .map(normalizeImageUrl)
    .filter(isPublicImageUrl)
    .join(',')
}

function resolveProductImage(product) {
  const image =
    product?.image ||
    product?.imagem ||
    product?.foto_principal ||
    product?.fallback_foto_url ||
    product?.foto_url

  return normalizeImageUrl(image)
}

function productIsVisible(product) {
  if (!product) return false
  if (product.hidden === true || product.oculto === true || product.oculta === true) return false
  if (product.active === false || product.ativo === false || product.inativo === true) return false
  return true
}

function inferProductType(product) {
  if (product?.productType) return product.productType
  if (product?.tipo) return product.tipo
  if (product?.subgrupo) return `Subgrupo ${product.subgrupo}`
  if (product?.grupo) return `Grupo ${product.grupo}`
  return 'Material de construção'
}

function normalizeBrand(value) {
  const brand = cleanText(value, { maxLength: 100 })
  if (!brand || brand.toUpperCase() === 'GERAL') return META_FEED_BRAND
  return brand
}

function inferLabels(product, availability) {
  const labels = Array.isArray(product?.labels) ? product.labels : []
  return [
    labels[0] || inferProductType(product),
    labels[1] || (availability === 'in stock' ? 'Pronta entrega' : 'Sob consulta'),
    labels[2] || (Number(product?.secao || 0) ? `Seção ${product.secao}` : ''),
  ]
}

function normalizeFeedProduct(product) {
  const id = cleanText(product?.id || product?.sku, { maxLength: 100 })
  const title = cleanText(product?.title || product?.nome, { maxLength: 200 })
  const description = cleanText(
    product?.description || product?.descricao || `${title} disponível no Galpão do Aço em Boa Vista RR.`,
    { maxLength: 9999 }
  )
  const price = normalizeNumber(product?.price ?? product?.preco)
  const stock = Math.max(0, Math.floor(normalizeNumber(product?.stock ?? product?.estoque)))
  const availability = stock > 0 ? 'in stock' : 'out of stock'
  const imageLink = resolveProductImage(product)
  const link = normalizeProductUrl(product)
  const discount = obterDescontoPromocional(product)
  const salePriceFromSite = discount > 0 ? calcularPrecoPromocional(price, discount) : 0
  const salePrice = normalizeNumber(product?.salePrice ?? product?.sale_price ?? salePriceFromSite)
  const labels = inferLabels(product, availability)

  return {
    id,
    title,
    description,
    availability,
    condition: 'new',
    price: formatMetaPrice(price),
    link,
    image_link: imageLink,
    brand: normalizeBrand(product?.brand || product?.marca),
    inventory: String(stock),
    google_product_category: cleanText(product?.category || product?.google_product_category || META_FEED_GOOGLE_CATEGORY),
    product_type: cleanText(inferProductType(product)),
    sale_price: salePrice > 0 && salePrice < price ? formatMetaPrice(salePrice) : '',
    additional_image_link: normalizeAdditionalImages(product),
    custom_label_0: cleanText(labels[0], { maxLength: 110 }),
    custom_label_1: cleanText(labels[1], { maxLength: 110 }),
    custom_label_2: cleanText(labels[2], { maxLength: 110 }),
    _rawPrice: price,
  }
}

export function isValidMetaFeedRow(row) {
  return Boolean(
    row?.id &&
      row?.title &&
      row?.description &&
      row?._rawPrice > 0 &&
      row?.price &&
      isPublicUrl(row?.link) &&
      isPublicImageUrl(row?.image_link)
  )
}

export function productToMetaFeedRow(product) {
  if (!productIsVisible(product)) return null

  const row = normalizeFeedProduct(product)
  if (!isValidMetaFeedRow(row)) return null

  return META_FEED_HEADERS.map((header) => row[header] || '')
}

export function productsToMetaCsv(products) {
  const rows = [META_FEED_HEADERS]

  for (const product of products || []) {
    const row = productToMetaFeedRow(product)
    if (row) rows.push(row)
  }

  return `${rows.map((row) => row.map(escapeCsvField).join(',')).join('\n')}\n`
}

export async function loadMetaFeedProducts() {
  const products = await getCatalogoCompletoComFallback({ revalidate: 1800 })

  // Use mocks only in local setup when explicitly enabled. Production should always prefer ERP/API data.
  if ((!products || products.length === 0) && process.env.META_FEED_USE_MOCKS === 'true') {
    return MOCK_META_PRODUCTS
  }

  return products || []
}
