'use client'

import { useEffect } from 'react'
import { trackCategoryView, trackSearch } from '@/lib/analytics'

export default function CatalogViewTracker({
  busca = '',
  categoria = '',
  secao = '',
  subgrupo = '',
  total = 0,
}) {
  useEffect(() => {
    if (busca) {
      trackSearch({ search_term: busca, results_count: total })
    }

    if (categoria || secao || subgrupo) {
      trackCategoryView({
        category_name: categoria || (secao ? `Seção ${secao}` : '') || (subgrupo ? `Subgrupo ${subgrupo}` : ''),
        product_type: subgrupo ? `Subgrupo ${subgrupo}` : secao ? `Seção ${secao}` : categoria,
      })
    }
  }, [busca, categoria, secao, subgrupo, total])

  return null
}
