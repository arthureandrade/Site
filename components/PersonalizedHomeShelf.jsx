'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import ProductCard from '@/components/ProductCard'
import {
  getTopPersonalizationCategories,
  normalizePersonalizationText,
  readPersonalizationProfile,
} from '@/lib/personalization'
import { obterDescontoPromocional } from '@/lib/ofertas'

const INTENT_GROUPS = [
  {
    triggers: ['telha', 'cobertura', 'cumeeira'],
    complements: ['parafuso', 'cumeeira', 'veda', 'vedante', 'rufo', 'calha', 'silicone'],
  },
  {
    triggers: ['parafuso', 'ferragem', 'fixacao'],
    complements: ['bucha', 'arruela', 'porca', 'broca', 'chave', 'soquete'],
  },
  {
    triggers: ['solda', 'eletrodo', 'maquina de solda'],
    complements: ['eletrodo', 'disco', 'mascara', 'arame', 'esmerilhadeira'],
  },
  {
    triggers: ['hidraulica', 'tubo', 'pvc', 'caixa d agua'],
    complements: ['joelho', 'luva', 'registro', 'torneira', 'cola pvc', 'adaptador'],
  },
  {
    triggers: ['eletrica', 'fio', 'cabo', 'disjuntor'],
    complements: ['tomada', 'interruptor', 'eletroduto', 'caixa', 'conector'],
  },
  {
    triggers: ['ferramenta', 'furadeira', 'serra', 'esmerilhadeira'],
    complements: ['broca', 'disco', 'luva', 'oculos', 'trena', 'extensao'],
  },
]

function produtoTexto(produto) {
  return normalizePersonalizationText(
    [
      produto?.nome,
      produto?.marca,
      produto?.grupo_nome,
      produto?.subgrupo_nome,
      produto?.grupo,
      produto?.subgrupo,
    ]
      .filter(Boolean)
      .join(' ')
  )
}

function produtoCategoria(produto) {
  return String(produto?.grupo_nome || produto?.marca || produto?.grupo || '').trim()
}

function produtoVisivel(produto) {
  return produto?.id && String(produto?.nome || '').trim() && Number(produto?.preco || 0) > 0
}

function produtoCasaTermos(produto, termos = []) {
  if (!termos.length) return false
  const texto = produtoTexto(produto)
  return termos.some((termo) => {
    const normalizado = normalizePersonalizationText(termo)
    return normalizado.length >= 3 && texto.includes(normalizado)
  })
}

function uniqueById(produtos = []) {
  const map = new Map()
  for (const produto of produtos) {
    if (!produto?.id) continue
    map.set(Number(produto.id), produto)
  }
  return Array.from(map.values())
}

function scoreProduto(produto, termos = [], categorias = [], cartIds = [], viewedIds = []) {
  const texto = produtoTexto(produto)
  const categoria = normalizePersonalizationText(produtoCategoria(produto))
  let score = 0

  if (Number(produto?.estoque || 0) > 0) score += 2
  if (Number(produto?.preco || 0) > 0) score += 1
  if (cartIds.includes(Number(produto.id))) score -= 20
  if (viewedIds.includes(Number(produto.id))) score -= 8

  for (const termo of termos) {
    const normalizado = normalizePersonalizationText(termo)
    if (normalizado.length >= 3 && texto.includes(normalizado)) score += 4
  }

  for (const item of categorias) {
    const normalizado = normalizePersonalizationText(item)
    if (normalizado && (categoria.includes(normalizado) || texto.includes(normalizado))) score += 6
  }

  return score
}

function getComplementTerms(profile) {
  const base = [
    ...(profile?.searches || []).map((item) => item?.term),
    ...(profile?.viewed || []).map((item) => item?.nome),
  ]
    .filter(Boolean)
    .join(' ')

  const normalizedBase = normalizePersonalizationText(base)
  const terms = new Set()

  for (const group of INTENT_GROUPS) {
    if (group.triggers.some((trigger) => normalizedBase.includes(normalizePersonalizationText(trigger)))) {
      group.complements.forEach((term) => terms.add(term))
    }
  }

  return Array.from(terms)
}

function ProductRow({ titulo, descricao, produtos }) {
  if (!produtos.length) return null

  return (
    <div className="mt-5">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <h3 className="text-lg font-black uppercase tracking-[0.04em] text-slate-950">{titulo}</h3>
          {descricao ? <p className="mt-1 text-sm text-slate-600">{descricao}</p> : null}
        </div>
      </div>
      <div className="overflow-x-auto pb-3">
        <div className="flex gap-3 sm:gap-4">
          {produtos.map((produto) => (
            <div key={`${titulo}-${produto.id}`} className="w-[168px] shrink-0 sm:w-[220px] lg:w-[250px] xl:w-[272px]">
              <ProductCard produto={produto} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function PersonalizedHomeShelf({ produtos = [] }) {
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    setProfile(readPersonalizationProfile())
  }, [])

  const data = useMemo(() => {
    if (!profile) {
      return {
        topCategories: [],
        recentProducts: [],
        workProducts: [],
        complementProducts: [],
        offerProducts: [],
      }
    }

    const catalog = uniqueById(produtos).filter(produtoVisivel)
    const catalogMap = new Map(catalog.map((produto) => [Number(produto.id), produto]))
    const viewedIds = (profile.viewed || []).map((item) => Number(item?.id || 0)).filter(Boolean)
    const cartIds = (profile.cartIds || []).map((id) => Number(id || 0)).filter(Boolean)
    const topCategories = getTopPersonalizationCategories(profile, 5)
    const searchTerms = (profile.searches || []).map((item) => item?.term).filter(Boolean).slice(0, 6)
    const viewedNames = (profile.viewed || []).map((item) => item?.nome).filter(Boolean).slice(0, 8)
    const behaviorTerms = [...searchTerms, ...viewedNames]
    const complementTerms = getComplementTerms(profile)

    const recentProducts = uniqueById(
      (profile.viewed || [])
        .map((item) => catalogMap.get(Number(item?.id || 0)) || item)
        .filter(produtoVisivel)
    ).slice(0, 8)

    const workProducts = catalog
      .filter((produto) => !viewedIds.includes(Number(produto.id)))
      .map((produto) => ({
        produto,
        score: scoreProduto(produto, behaviorTerms, topCategories, cartIds, viewedIds),
      }))
      .filter((item) => item.score > 2)
      .sort((a, b) => b.score - a.score || Number(b.produto.estoque || 0) - Number(a.produto.estoque || 0))
      .map((item) => item.produto)
      .slice(0, 10)

    const complementProducts = complementTerms.length
      ? catalog
          .filter((produto) => !viewedIds.includes(Number(produto.id)) && !cartIds.includes(Number(produto.id)))
          .filter((produto) => produtoCasaTermos(produto, complementTerms))
          .slice(0, 10)
      : []
    const usedIds = new Set([
      ...viewedIds,
      ...cartIds,
      ...workProducts.map((produto) => Number(produto.id)),
      ...complementProducts.map((produto) => Number(produto.id)),
    ])
    const offerTerms = [...behaviorTerms, ...topCategories, ...complementTerms]
    const offerProducts = catalog
      .filter((produto) => !usedIds.has(Number(produto.id)))
      .filter((produto) => obterDescontoPromocional(produto) > 0)
      .map((produto) => ({
        produto,
        score: scoreProduto(produto, offerTerms, topCategories, cartIds, viewedIds),
      }))
      .filter((item) => item.score > 2)
      .sort((a, b) => b.score - a.score || Number(b.produto.estoque || 0) - Number(a.produto.estoque || 0))
      .map((item) => item.produto)
      .slice(0, 10)

    return {
      topCategories,
      recentProducts,
      workProducts,
      complementProducts,
      offerProducts,
    }
  }, [profile, produtos])

  const hasHistory =
    data.recentProducts.length ||
    data.workProducts.length ||
    data.complementProducts.length ||
    data.offerProducts.length ||
    data.topCategories.length

  if (!profile || !hasHistory) return null

  return (
    <section className="bg-[linear-gradient(180deg,#fff7f4_0%,#ffffff_100%)] py-5 sm:py-7">
      <div className="mx-auto max-w-[1760px] px-4 sm:px-6 lg:px-8">
        <div className="rounded-[26px] border border-red-100 bg-white p-4 shadow-[0_16px_50px_rgba(15,23,42,0.07)] sm:p-5 lg:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex rounded-md bg-brand px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-white">
                Compra personalizada
              </div>
              <h2 className="mt-3 text-2xl font-black uppercase leading-tight text-brand sm:text-3xl">
                Continue sua compra para a obra
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
                Separamos produtos a partir do que você viu, buscou e adicionou ao orçamento neste navegador.
              </p>
            </div>
            <Link
              href="/produtos"
              className="inline-flex w-full items-center justify-center rounded-2xl border border-brand px-5 py-3 text-sm font-black uppercase tracking-wide text-brand transition hover:border-primary hover:text-primary sm:w-auto"
            >
              Abrir catálogo
            </Link>
          </div>

          {data.topCategories.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {data.topCategories.map((categoria) => (
                <Link
                  key={categoria}
                  href={`/produtos?busca=${encodeURIComponent(categoria)}`}
                  className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-primary transition hover:bg-red-100"
                >
                  {categoria}
                </Link>
              ))}
            </div>
          ) : null}

          <ProductRow
            titulo="Vistos recentemente"
            descricao="Produtos que você abriu nas últimas visitas."
            produtos={data.recentProducts}
          />
          <ProductRow
            titulo="Mais produtos da sua obra"
            descricao="Itens parecidos com suas buscas, categorias e produtos vistos."
            produtos={data.workProducts}
          />
          <ProductRow
            titulo="Complementos para seu orçamento"
            descricao="Sugestões para fechar o conjunto da compra sem esquecer acessórios."
            produtos={data.complementProducts}
          />
          <ProductRow
            titulo="Ofertas relacionadas"
            descricao="Produtos com desconto online ligados ao seu histórico de navegação."
            produtos={data.offerProducts}
          />
        </div>
      </div>
    </section>
  )
}
