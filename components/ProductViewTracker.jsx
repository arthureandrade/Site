'use client'

import { useEffect } from 'react'
import { trackViewContent } from '@/lib/analytics'
import { trackProductView } from '@/lib/personalization'

export default function ProductViewTracker({ produto }) {
  useEffect(() => {
    trackProductView(produto)
    trackViewContent({
      content_id: produto?.id,
      content_name: produto?.nome,
      content_type: 'product',
      value: Number(produto?.preco || 0) > 0 ? Number(produto.preco) : undefined,
      currency: 'BRL',
      product_type: produto?.subgrupo_nome || produto?.grupo_nome || produto?.marca || '',
      category: produto?.grupo_nome || produto?.secao_nome || produto?.marca || '',
    })
  }, [produto])

  return null
}
