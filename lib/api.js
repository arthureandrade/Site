/**
 * lib/api.js — Galpão do Aço
 * Funções para consumir a API de Produtos.
 *
 * Configure a variável de ambiente:
 *   NEXT_PUBLIC_API_URL=https://sua-api.com.br
 */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:8000'

/**
 * Formata o valor como preço em Reais.
 * @param {number} valor
 */
export function formatarPreco(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor ?? 0)
}

/**
 * Retorna a URL completa da imagem do produto.
 * Se não houver foto, retorna null.
 * @param {string|null} fotoUrl
 */
export function imagemUrl(fotoUrl) {
  if (!fotoUrl) return null
  if (fotoUrl.startsWith('http')) return fotoUrl
  return `${API_URL}${fotoUrl}`
}

/**
 * Lista produtos com filtros e paginação.
 * @param {{ marca?: string, em_estoque?: boolean, skip?: number, limit?: number }} params
 * @returns {Promise<{ total: number, produtos: Produto[] }>}
 */
export async function getProdutos({ marca, em_estoque, skip = 0, limit = 24 } = {}) {
  const qs = new URLSearchParams()
  if (marca)                       qs.set('marca',       marca)
  if (em_estoque != null)          qs.set('em_estoque',  em_estoque)
  qs.set('skip',  skip)
  qs.set('limit', limit)

  try {
    const res = await fetch(`${API_URL}/produtos?${qs}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (e) {
    console.error('[API] getProdutos:', e)
    return { total: 0, produtos: [] }
  }
}

/**
 * Busca um produto pelo ID.
 * @param {number|string} id
 * @returns {Promise<Produto|null>}
 */
export async function getProduto(id) {
  try {
    const res = await fetch(`${API_URL}/produtos/${id}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    return await res.json()
  } catch (e) {
    console.error('[API] getProduto:', e)
    return null
  }
}

/**
 * Monta o link de WhatsApp com mensagem pré-preenchida.
 * @param {string} nome Nome do produto
 * @param {number} preco Preço do produto
 */
export function whatsappLink(nome, preco) {
  const numero = process.env.NEXT_PUBLIC_WHATSAPP || '559532240115'
  const msg = `Olá! Tenho interesse no produto *${nome}* — ${formatarPreco(preco)}. Poderia me passar mais informações?`
  return `https://wa.me/${numero}?text=${encodeURIComponent(msg)}`
}
