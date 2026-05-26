'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import ProductCard from '@/components/ProductCard'
import {
  getTopPersonalizationCategories,
  normalizePersonalizationText,
  readPersonalizationProfile,
} from '@/lib/personalization'
import {
  calcularScoreCatalogo,
  inferirCategoriaProduto,
  inferirGrupoCatalogo,
} from '@/lib/catalogoPublico'
import { obterDescontoPromocional } from '@/lib/ofertas'

const PROJECT_INTENTS = [
  {
    key: 'cobertura',
    triggers: ['telha', 'cobertura', 'cumeeira', 'rufo', 'calha', 'galvalume', 'fibrocimento', 'veda telha'],
    complements: ['parafuso', 'autobrocante', 'veda telha', 'vedante', 'cumeeira', 'rufo', 'calha', 'silicone', 'broca'],
    sections: ['Telhas e Coberturas', 'Ferragens e Fixação', 'Acabamento, Pintura e Químicos'],
  },
  {
    key: 'serralheria',
    triggers: ['metalon', 'perfil', 'cantoneira', 'barra chata', 'chapa', 'tubo industrial', 'serralheiro', 'ferro'],
    complements: ['disco corte', 'disco desbaste', 'eletrodo', 'solda', 'esmerilhadeira', 'broca', 'luva', 'oculos', 'trena'],
    sections: ['Aço e Perfis', 'Solda, Corte e Abrasivos', 'Máquinas e Equipamentos', 'EPIs, Casa e Utilidades'],
  },
  {
    key: 'fixacao',
    triggers: ['parafuso', 'chumbador', 'bucha', 'prego', 'porca', 'arruela', 'rebite', 'ferragem'],
    complements: ['broca', 'chave', 'soquete', 'arruela', 'porca', 'bucha', 'alicate', 'nivel'],
    sections: ['Ferragens e Fixação', 'Ferramentas Manuais e Agrícolas', 'Máquinas e Equipamentos'],
  },
  {
    key: 'solda',
    triggers: ['solda', 'eletrodo', 'arame mig', 'disco corte', 'disco flap', 'abrasivo', 'mascara de solda'],
    complements: ['eletrodo', 'disco', 'mascara', 'luva', 'oculos', 'esmerilhadeira', 'arame mig', 'avental'],
    sections: ['Solda, Corte e Abrasivos', 'Máquinas e Equipamentos', 'EPIs, Casa e Utilidades'],
  },
  {
    key: 'hidraulica',
    triggers: ['hidraulica', 'tubo pvc', 'joelho', 'luva soldavel', 'registro', 'torneira', 'caixa d agua', 'sifao'],
    complements: ['joelho', 'luva', 'registro', 'torneira', 'cola pvc', 'adaptador', 'veda rosca', 'sifao', 'ralo'],
    sections: ['Hidráulica, Elétrica e Iluminação'],
  },
  {
    key: 'eletrica',
    triggers: ['eletrica', 'fio', 'cabo flex', 'disjuntor', 'tomada', 'interruptor', 'eletroduto', 'lampada'],
    complements: ['tomada', 'interruptor', 'eletroduto', 'caixa', 'conector', 'fita isolante', 'lampada', 'plug'],
    sections: ['Hidráulica, Elétrica e Iluminação'],
  },
  {
    key: 'pintura',
    triggers: ['tinta', 'pintura', 'spray', 'solvente', 'thinner', 'impermeabilizante', 'selador', 'verniz'],
    complements: ['rolo', 'pincel', 'bandeja', 'fita', 'solvente', 'thinner', 'silicone', 'lixa'],
    sections: ['Acabamento, Pintura e Químicos'],
  },
  {
    key: 'obra',
    triggers: ['argamassa', 'cimento', 'rejunte', 'concreto', 'bloco', 'acabamento'],
    complements: ['desempenadeira', 'colher', 'balde', 'nivel', 'trena', 'luva', 'impermeabilizante'],
    sections: ['Acabamento, Pintura e Químicos', 'Ferramentas Manuais e Agrícolas', 'EPIs, Casa e Utilidades'],
  },
]

const STOP_TERMS = new Set([
  'aco',
  'aco',
  'galpao',
  'geral',
  'para',
  'com',
  'sem',
  'por',
  'und',
  'un',
  'mt',
  'mm',
  'cm',
  'mts',
  'kg',
  'pc',
  'pct',
  'produto',
  'linha',
])

function produtoTexto(produto) {
  return normalizePersonalizationText(
    [
      produto?.nome,
      produto?.descricao,
      produto?.marca,
      produto?.grupo_nome,
      produto?.nome_grupo,
      produto?.subgrupo_nome,
      produto?.nome_subgrupo,
      produto?.grupo,
      produto?.subgrupo,
    ]
      .filter(Boolean)
      .join(' ')
  )
}

function produtoCategoria(produto) {
  return String(produto?.grupo_nome || produto?.nome_grupo || produto?.marca || produto?.grupo || '').trim()
}

function produtoVisivel(produto) {
  return produto?.id && String(produto?.nome || '').trim() && Number(produto?.preco || 0) > 0
}

function produtoTemFoto(produto) {
  return Boolean(produto?.fallback_foto_url || produto?.foto_url || produto?.image)
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

function uniqueStrings(items = []) {
  return Array.from(
    new Set(
      items
        .map((item) => String(item || '').trim())
        .filter(Boolean)
    )
  )
}

function termosRelevantes(valor) {
  return normalizePersonalizationText(valor)
    .split(/[^a-z0-9]+/g)
    .map((termo) => termo.trim())
    .filter((termo) => termo.length >= 3 && !STOP_TERMS.has(termo) && !/^\d+$/.test(termo))
}

function obterTermosProduto(produto) {
  return termosRelevantes([
    produto?.nome,
    produto?.descricao,
    produto?.marca,
    produto?.grupo_nome,
    produto?.nome_grupo,
    produto?.subgrupo_nome,
    produto?.nome_subgrupo,
  ].filter(Boolean).join(' '))
}

function contarCasamentosProduto(produto, termos = []) {
  if (!termos.length) return 0
  const texto = produtoTexto(produto)
  return termos.reduce((total, termo) => {
    const normalizado = normalizePersonalizationText(termo)
    return total + (normalizado.length >= 3 && texto.includes(normalizado) ? 1 : 0)
  }, 0)
}

function obterSecaoProduto(produto) {
  return inferirCategoriaProduto(produto)
}

function obterGrupoProduto(produto) {
  return inferirGrupoCatalogo(produto)?.id || ''
}

function obterMarcaProduto(produto) {
  return normalizePersonalizationText(produto?.marca || '')
}

function obterProdutoHistorico(item, catalogMap) {
  const id = Number(item?.id || item || 0)
  return catalogMap.get(id) || (produtoVisivel(item) ? item : null)
}

function obterProdutosDoHistorico(profile, catalogMap) {
  const ids = [
    ...(profile?.cartIds || []),
    ...(profile?.clickedIds || []),
    ...(profile?.viewed || []).map((item) => item?.id),
  ]

  const porId = ids.map((id) => obterProdutoHistorico(id, catalogMap)).filter(Boolean)
  const snapshots = (profile?.viewed || []).map((item) => obterProdutoHistorico(item, catalogMap)).filter(Boolean)

  return uniqueById([...porId, ...snapshots]).filter(produtoVisivel)
}

function obterIntencoes(contextText) {
  const normalized = normalizePersonalizationText(contextText)
  return PROJECT_INTENTS.filter((intent) =>
    intent.triggers.some((trigger) => normalized.includes(normalizePersonalizationText(trigger)))
  )
}

function mediana(valores = []) {
  const ordenados = valores.filter((valor) => Number(valor) > 0).sort((a, b) => a - b)
  if (!ordenados.length) return 0
  return ordenados[Math.floor(ordenados.length / 2)]
}

function montarContextoPersonalizacao(profile, catalog, catalogMap) {
  const viewedIds = (profile?.viewed || []).map((item) => Number(item?.id || 0)).filter(Boolean)
  const cartIds = (profile?.cartIds || []).map((id) => Number(id || 0)).filter(Boolean)
  const clickedIds = (profile?.clickedIds || []).map((id) => Number(id || 0)).filter(Boolean)
  const topCategories = getTopPersonalizationCategories(profile, 6)
  const searchTerms = (profile?.searches || []).map((item) => item?.term).filter(Boolean).slice(0, 10)
  const historyProducts = obterProdutosDoHistorico(profile, catalogMap)
  const historyText = [
    ...searchTerms,
    ...topCategories,
    ...historyProducts.map((produto) => produto?.nome),
    ...historyProducts.map((produto) => produtoCategoria(produto)),
  ].filter(Boolean).join(' ')
  const intents = obterIntencoes(historyText)
  const behaviorTerms = uniqueStrings([
    ...searchTerms,
    ...topCategories,
    ...termosRelevantes(historyText),
  ]).slice(0, 40)
  const productTerms = uniqueStrings(historyProducts.flatMap(obterTermosProduto)).slice(0, 60)
  const sections = new Set(
    uniqueStrings([
      ...topCategories,
      ...historyProducts.map(obterSecaoProduto),
    ]).map(normalizePersonalizationText)
  )
  const groups = new Set(historyProducts.map(obterGrupoProduto).filter(Boolean))
  const brands = new Set(historyProducts.map(obterMarcaProduto).filter(Boolean))
  const complementTerms = uniqueStrings(intents.flatMap((intent) => intent.complements))
  const complementSections = new Set(
    intents
      .flatMap((intent) => intent.sections)
      .map(normalizePersonalizationText)
      .filter(Boolean)
  )
  const medianPrice = mediana(historyProducts.map((produto) => Number(produto?.preco || 0)))

  return {
    viewedIds,
    cartIds,
    clickedIds,
    topCategories,
    searchTerms,
    historyProducts,
    behaviorTerms,
    productTerms,
    sections,
    groups,
    brands,
    intents,
    complementTerms,
    complementSections,
    medianPrice,
    hasBehavior: Boolean(historyProducts.length || searchTerms.length || topCategories.length),
  }
}

function scoreFaixaPreco(produto, medianPrice) {
  const preco = Number(produto?.preco || 0)
  if (!preco || !medianPrice) return 0

  const ratio = Math.abs(preco - medianPrice) / Math.max(preco, medianPrice)
  if (ratio <= 0.25) return 22
  if (ratio <= 0.5) return 12
  if (ratio <= 0.85) return 5
  return 0
}

function scoreProdutoInteligente(produto, context, mode = 'work') {
  const id = Number(produto?.id || 0)
  const secao = normalizePersonalizationText(obterSecaoProduto(produto))
  const grupo = obterGrupoProduto(produto)
  const marca = obterMarcaProduto(produto)
  const desconto = Number(obterDescontoPromocional(produto) || 0)
  const estoque = Number(produto?.estoque || 0)
  const produtoNoCarrinho = context.cartIds.includes(id)
  const produtoVisto = context.viewedIds.includes(id)
  const produtoClicado = context.clickedIds.includes(id)
  const termoMatches = contarCasamentosProduto(produto, context.behaviorTerms)
  const produtoTermMatches = contarCasamentosProduto(produto, context.productTerms)
  const complementMatches = contarCasamentosProduto(produto, context.complementTerms)
  let score = calcularScoreCatalogo(produto) * 0.12

  if (estoque > 0) score += 22
  if (produtoTemFoto(produto)) score += 10
  if (desconto > 0) score += mode === 'offer' ? Math.min(28, desconto * 2) : Math.min(20, desconto * 1.4)
  if (context.sections.has(secao)) score += mode === 'complement' ? 16 : mode === 'offer' ? 30 : 28
  if (context.groups.has(grupo)) score += mode === 'complement' ? 10 : mode === 'offer' ? 64 : 28
  if (marca && context.brands.has(marca)) score += 12
  if (produtoClicado && mode !== 'offer') score += 8
  if (termoMatches) score += termoMatches * (mode === 'complement' ? 8 : 12)
  if (produtoTermMatches) score += Math.min(40, produtoTermMatches * 5)
  if (complementMatches) score += mode === 'complement' ? complementMatches * 34 : complementMatches * 8
  if (context.complementSections.has(secao)) score += mode === 'complement' ? 24 : 8
  score += scoreFaixaPreco(produto, context.medianPrice)

  if (produtoNoCarrinho) score -= 90
  if (produtoVisto && mode !== 'recent') score -= mode === 'offer' ? 28 : 45

  return score
}

function produtoEhComplemento(produto, context) {
  const secao = normalizePersonalizationText(obterSecaoProduto(produto))
  return produtoCasaTermos(produto, context.complementTerms) || context.complementSections.has(secao)
}

function calcularAfinidadeHistorico(produto, context) {
  const secao = normalizePersonalizationText(obterSecaoProduto(produto))
  const grupo = obterGrupoProduto(produto)
  const marca = obterMarcaProduto(produto)
  const termoMatches = contarCasamentosProduto(produto, context.behaviorTerms)
  const produtoTermMatches = contarCasamentosProduto(produto, context.productTerms)
  const mesmaSecao = context.sections.has(secao)
  const mesmoGrupo = context.groups.has(grupo)
  const mesmaMarca = Boolean(marca && context.brands.has(marca))
  const termosFortes = termoMatches >= 2 || produtoTermMatches >= 3
  const termosExatos = termoMatches >= 1 && produtoTermMatches >= 1

  return {
    forte: Boolean(
      mesmoGrupo ||
        termosExatos ||
        (mesmaSecao && termosFortes) ||
        (mesmaMarca && (mesmaSecao || termoMatches >= 1 || produtoTermMatches >= 2))
    ),
    score:
      (mesmoGrupo ? 80 : 0) +
      (mesmaSecao ? 34 : 0) +
      (mesmaMarca ? 18 : 0) +
      Math.min(64, termoMatches * 16 + produtoTermMatches * 10),
  }
}

function selecionarProdutosDiversificados(items = [], { limit = 10, maxPerGroup = 2, maxPerSection = 4 } = {}) {
  const selecionados = []
  const grupos = new Map()
  const secoes = new Map()

  for (const item of items) {
    if (selecionados.length >= limit) break
    const produto = item?.produto
    const grupo = obterGrupoProduto(produto) || `produto-${produto?.id}`
    const secao = normalizePersonalizationText(obterSecaoProduto(produto))
    const totalGrupo = grupos.get(grupo) || 0
    const totalSecao = secoes.get(secao) || 0

    if (totalGrupo >= maxPerGroup || totalSecao >= maxPerSection) continue

    selecionados.push(produto)
    grupos.set(grupo, totalGrupo + 1)
    secoes.set(secao, totalSecao + 1)
  }

  if (selecionados.length >= limit) return selecionados

  const usados = new Set(selecionados.map((produto) => Number(produto?.id || 0)))
  for (const item of items) {
    if (selecionados.length >= limit) break
    if (!item?.produto?.id || usados.has(Number(item.produto.id))) continue
    selecionados.push(item.produto)
    usados.add(Number(item.produto.id))
  }

  return selecionados
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
    const context = montarContextoPersonalizacao(profile, catalog, catalogMap)

    const recentProducts = uniqueById(
      (profile.viewed || [])
        .map((item) => catalogMap.get(Number(item?.id || 0)) || item)
        .filter(produtoVisivel)
    ).slice(0, 8)

    const blockedBaseIds = new Set([...context.cartIds])
    const workCandidates = catalog
      .filter((produto) => !blockedBaseIds.has(Number(produto.id)))
      .filter((produto) => !context.viewedIds.includes(Number(produto.id)))
      .map((produto) => ({
        produto,
        score: scoreProdutoInteligente(produto, context, 'work'),
      }))
      .filter((item) => item.score >= (context.hasBehavior ? 55 : 120))
      .sort((a, b) => b.score - a.score || Number(b.produto.estoque || 0) - Number(a.produto.estoque || 0))
    const workProducts = selecionarProdutosDiversificados(workCandidates, {
      limit: 10,
      maxPerGroup: 2,
      maxPerSection: 4,
    })

    const complementProducts = context.intents.length
      ? catalog
          .filter((produto) => !context.cartIds.includes(Number(produto.id)))
          .filter((produto) => !context.viewedIds.includes(Number(produto.id)))
          .filter((produto) => produtoEhComplemento(produto, context))
          .map((produto) => ({
            produto,
            score: scoreProdutoInteligente(produto, context, 'complement'),
          }))
          .filter((item) => item.score >= 45)
          .sort((a, b) => b.score - a.score || Number(b.produto.estoque || 0) - Number(a.produto.estoque || 0))
          .map((item) => item.produto)
          .slice(0, 10)
      : []

    const usedIds = new Set([
      ...context.viewedIds,
      ...context.cartIds,
      ...workProducts.map((produto) => Number(produto.id)),
      ...complementProducts.map((produto) => Number(produto.id)),
    ])

    const offerProducts = context.hasBehavior
      ? catalog
          .filter((produto) => !usedIds.has(Number(produto.id)))
          .filter((produto) => obterDescontoPromocional(produto) > 0)
          .map((produto) => {
            const afinidade = calcularAfinidadeHistorico(produto, context)
            return {
              produto,
              afinidade,
              desconto: Number(obterDescontoPromocional(produto) || 0),
              score: scoreProdutoInteligente(produto, context, 'offer') + afinidade.score,
            }
          })
          .filter((item) => item.afinidade.forte)
          .filter((item) => item.score >= 90)
          .sort(
            (a, b) =>
              b.score - a.score ||
              b.afinidade.score - a.afinidade.score ||
              b.desconto - a.desconto ||
              Number(b.produto.estoque || 0) - Number(a.produto.estoque || 0)
          )
          .map((item) => item.produto)
          .slice(0, 10)
      : []

    return {
      topCategories: context.topCategories,
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
                Separamos produtos a partir do que você viu, buscou, clicou e adicionou ao orçamento neste navegador.
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
            descricao="Itens no mesmo contexto da sua compra, com variedade para não mostrar só um tipo de produto."
            produtos={data.workProducts}
          />
          <ProductRow
            titulo="Complementos para seu orçamento"
            descricao="Acessórios e itens de apoio para fechar o conjunto da compra."
            produtos={data.complementProducts}
          />
          <ProductRow
            titulo="Ofertas relacionadas"
            descricao="Produtos com desconto bem parecidos com o que você viu, buscou ou clicou."
            produtos={data.offerProducts}
          />
        </div>
      </div>
    </section>
  )
}
