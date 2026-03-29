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

export async function getProdutos({ busca, marca, em_estoque, com_preco = true, skip = 0, limit = 24 } = {}) {
  const qs = new URLSearchParams()
  if (busca) qs.set('busca', busca)
  if (marca) qs.set('marca', marca)
  if (em_estoque != null) qs.set('em_estoque', em_estoque)
  if (com_preco != null) qs.set('com_preco', com_preco)
  qs.set('skip', skip)
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

export async function getProdutosDestaque({ limit = 8, meses = 3, preco_min = 100 } = {}) {
  const qs = new URLSearchParams()
  qs.set('limit', limit)
  qs.set('meses', meses)
  qs.set('preco_min', preco_min)

  try {
    const res = await fetch(`${API_URL}/produtos/destaques?${qs}`, {
      next: { revalidate: 1800 },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (e) {
    console.error('[API] getProdutosDestaque:', e)
    return { total: 0, produtos: [] }
  }
}

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

export function whatsappLink(nome, preco) {
  const numero = process.env.NEXT_PUBLIC_WHATSAPP || '559532240115'
  const msg = `Ola! Tenho interesse no produto *${nome}* - ${formatarPreco(preco)}. Poderia me passar mais informacoes?`
  return `https://wa.me/${numero}?text=${encodeURIComponent(msg)}`
}
