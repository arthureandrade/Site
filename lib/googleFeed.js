import { calcularPrecoPromocional, obterDescontoPromocional } from '@/lib/ofertas'
import {
  META_FEED_BASE_URL,
  META_FEED_BRAND,
  META_FEED_GOOGLE_CATEGORY,
  META_FEED_SECAO,
  loadMetaFeedProducts,
  normalizeImageUrl,
  normalizeProductUrl,
} from '@/lib/metaFeed'

export const GOOGLE_FEED_HEADERS = [
  'id',
  'title',
  'description',
  'link',
  'image_link',
  'availability',
  'price',
  'sale_price',
  'condition',
  'brand',
  'google_product_category',
  'product_type',
  'custom_label_0',
  'custom_label_1',
  'custom_label_2',
  'identifier_exists',
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

function formatGooglePrice(value) {
  const number = normalizeNumber(value)
  if (number <= 0) return ''
  return `${number.toFixed(2)} BRL`
}

export function escapeTsvField(value) {
  return String(value ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isPublicUrl(value) {
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) && Boolean(url.hostname)
  } catch {
    return false
  }
}

function isPublicImageUrl(value) {
  if (!isPublicUrl(value)) return false
  const pathname = new URL(value).pathname.toLowerCase()
  return /\.(jpe?g|png|webp|gif|bmp|tiff?)$/.test(pathname)
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

function inferProductType(product) {
  if (product?.productType) return product.productType
  if (product?.subgrupo_nome) return product.subgrupo_nome
  if (product?.grupo_nome) return product.grupo_nome
  if (product?.subgrupo) return `Subgrupo ${product.subgrupo}`
  if (product?.grupo) return `Grupo ${product.grupo}`
  return 'Material de construção'
}

function normalizeBrand(value) {
  const brand = cleanText(value, { maxLength: 70 })
  if (!brand || brand.toUpperCase() === 'GERAL') return META_FEED_BRAND
  return brand
}

function productIsVisible(product) {
  if (!product) return false
  if (Number(product.secao || 0) !== META_FEED_SECAO) return false
  if (product.hidden === true || product.oculto === true || product.oculta === true) return false
  if (product.active === false || product.ativo === false || product.inativo === true) return false
  return true
}

function normalizeGoogleProduct(product) {
  const id = cleanText(product?.id || product?.sku, { maxLength: 50 })
  const title = cleanText(product?.title || product?.nome, { maxLength: 150 })
  const description = cleanText(
    product?.description || product?.descricao || `${title} disponível no Galpão do Aço em Boa Vista RR.`,
    { maxLength: 5000 }
  )
  const price = normalizeNumber(product?.price ?? product?.preco)
  const stock = Math.max(0, Math.floor(normalizeNumber(product?.stock ?? product?.estoque)))
  const link = normalizeProductUrl(product)
  const imageLink = resolveProductImage(product)
  const discount = obterDescontoPromocional(product)
  const salePrice = discount > 0 ? calcularPrecoPromocional(price, discount) : 0
  const productType = cleanText(inferProductType(product), { maxLength: 750 })

  return {
    id,
    title,
    description,
    link,
    image_link: imageLink,
    availability: stock > 0 ? 'in_stock' : 'out_of_stock',
    price: formatGooglePrice(price),
    sale_price: salePrice > 0 && salePrice < price ? formatGooglePrice(salePrice) : '',
    condition: 'new',
    brand: normalizeBrand(product?.brand || product?.marca),
    google_product_category: cleanText(
      product?.category || product?.google_product_category || META_FEED_GOOGLE_CATEGORY,
      { maxLength: 750 }
    ),
    product_type: productType,
    custom_label_0: productType,
    custom_label_1: stock > 0 ? 'Pronta entrega' : 'Sob consulta',
    custom_label_2: `Seção ${META_FEED_SECAO}`,
    identifier_exists: product?.gtin || product?.mpn ? 'yes' : 'no',
    _rawPrice: price,
  }
}

export function isValidGoogleFeedRow(row) {
  return Boolean(
    row?.id &&
      row?.title &&
      row?.description &&
      row?._rawPrice > 0 &&
      row?.price &&
      isPublicUrl(row?.link) &&
      row.link.startsWith(`${META_FEED_BASE_URL}/produto/`) &&
      isPublicImageUrl(row?.image_link)
  )
}

export function productToGoogleFeedRow(product) {
  if (!productIsVisible(product)) return null

  const row = normalizeGoogleProduct(product)
  if (!isValidGoogleFeedRow(row)) return null

  return GOOGLE_FEED_HEADERS.map((header) => row[header] || '')
}

export function productsToGoogleTsv(products) {
  const rows = [GOOGLE_FEED_HEADERS]

  for (const product of products || []) {
    const row = productToGoogleFeedRow(product)
    if (row) rows.push(row)
  }

  return `${rows.map((row) => row.map(escapeTsvField).join('\t')).join('\n')}\n`
}

export async function loadGoogleFeedProducts() {
  const products = await loadMetaFeedProducts()
  return products.filter((product) => Number(product?.secao || 0) === META_FEED_SECAO)
}
