export function obterDescontoPromocional(produto) {
  const subgrupo = Number(produto?.subgrupo || 0)
  if (subgrupo === 24) return 14
  if ([25, 26, 27, 28, 29, 30].includes(subgrupo)) return 18
  return 0
}

export function calcularPrecoPromocional(preco, desconto) {
  const valor = Number(preco || 0)
  if (valor <= 0 || desconto <= 0) return valor
  return valor * (1 - desconto / 100)
}
