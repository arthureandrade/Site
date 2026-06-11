import { unstable_cache } from 'next/cache'
import { PUBLIC_CACHE_SECONDS } from '@/lib/cacheConfig'
import { carregarCatalogoInicial } from '@/lib/catalogoPublico'

const carregarCatalogoInicialCacheado = unstable_cache(
  async (opcoes) => carregarCatalogoInicial(opcoes),
  ['catalogo-publico-inicial-v1'],
  {
    revalidate: PUBLIC_CACHE_SECONDS,
    tags: ['catalogo-publico'],
  }
)

export function carregarCatalogoInicialComCache(opcoes = {}) {
  return carregarCatalogoInicialCacheado(opcoes)
}
