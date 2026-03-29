export const SECAO_EXCLUIDA_VENDEDOR = 4
export const SECAO_FERRO_ACO = 6

export function numeroSecao(valor) {
  const numero = Number(valor)
  return Number.isFinite(numero) ? numero : null
}

export function ehProdutoFerroAco(produto) {
  return numeroSecao(produto?.secao) === SECAO_FERRO_ACO
}

export function deveExibirNoVendedor(produto) {
  const secao = numeroSecao(produto?.secao)
  return Number(produto?.preco) > 0 && secao !== SECAO_EXCLUIDA_VENDEDOR
}
