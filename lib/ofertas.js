export function obterDescontoPromocional(produto) {
  const subgrupo = Number(produto?.subgrupo || 0)
  if (subgrupo === 24) return 14
  if ([26, 27].includes(subgrupo)) return 12
  if ([28, 29].includes(subgrupo)) return 14
  if ([25, 30].includes(subgrupo)) return 18
  return 0
}

export function calcularPrecoPromocional(preco, desconto) {
  const valor = Number(preco || 0)
  if (valor <= 0 || desconto <= 0) return valor
  return valor * (1 - desconto / 100)
}
