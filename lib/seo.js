import { formatarPreco, imagemUrlProduto } from '@/lib/api'

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.galpaodoaco.com').replace(/\/$/, '')

export function absoluteSiteUrl(path = '/') {
  if (!path) return SITE_URL
  if (/^https?:\/\//i.test(path)) return path
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

export function stripHtml(value = '') {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function getProductDescription(produto) {
  const descricao = stripHtml(produto?.descricao)
  if (descricao) return descricao
  return `${produto?.nome || 'Produto'} disponível no Galpão do Aço em Boa Vista/RR.`
}

export function getProductUrl(produto) {
  return absoluteSiteUrl(`/produto/${encodeURIComponent(produto?.id || '')}`)
}

export function buildProductJsonLd(produto, { price, ocultarPreco = false } = {}) {
  if (!produto?.id || !produto?.nome) return null

  const foto = imagemUrlProduto(produto)
  const preco = Number(price ?? produto?.preco ?? 0)
  const temPreco = !ocultarPreco && preco > 0

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    productID: String(produto.id),
    sku: String(produto.id),
    name: produto.nome,
    description: getProductDescription(produto),
    brand: {
      '@type': 'Brand',
      name: produto.marca && produto.marca !== 'GERAL' ? produto.marca : 'Galpão do Aço',
    },
    url: getProductUrl(produto),
  }

  if (foto) schema.image = [foto]

  if (temPreco) {
    schema.offers = {
      '@type': 'Offer',
      url: getProductUrl(produto),
      priceCurrency: 'BRL',
      price: preco.toFixed(2),
      availability: Number(produto?.estoque || 0) > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: 'Galpão do Aço',
      },
    }
  }

  return schema
}

export function buildCatalogItemListJsonLd(produtos = []) {
  const itemListElement = produtos
    .filter((produto) => produto?.id && produto?.nome)
    .slice(0, 24)
    .map((produto, index) => {
      const productSchema = buildProductJsonLd(produto)
      return {
        '@type': 'ListItem',
        position: index + 1,
        url: getProductUrl(produto),
        item: productSchema || {
          '@type': 'Product',
          name: produto.nome,
          url: getProductUrl(produto),
        },
      }
    })

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Catálogo de produtos Galpão do Aço',
    description: 'Produtos com estoque real, preço atualizado e atendimento comercial em Boa Vista/RR.',
    numberOfItems: itemListElement.length,
    itemListElement,
  }
}

export function productSeoDescription(produto, preco) {
  const precoTexto = preco > 0 ? ` ${formatarPreco(preco)} à vista.` : ''
  return `${getProductDescription(produto)}${precoTexto}`.trim()
}
