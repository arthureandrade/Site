'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ProductCard from '@/components/ProductCard'
import { API_URL } from '@/lib/api'

async function buscarJson(url) {
  const resposta = await fetch(url, { cache: 'no-store' })
  if (!resposta.ok) {
    throw new Error(`HTTP ${resposta.status}`)
  }
  return resposta.json()
}

function deduplicarProdutos(lista) {
  const mapa = new Map()
  for (const produto of lista || []) {
    if (!produto?.id) continue
    mapa.set(Number(produto.id), produto)
  }
  return Array.from(mapa.values())
}

export default function VitrineSubgrupo24() {
  const [estado, setEstado] = useState({
    carregando: true,
    produtos: [],
    erro: '',
  })

  useEffect(() => {
    let cancelado = false

    async function carregar() {
      try {
        const tentativas = await Promise.allSettled([
          buscarJson(`${API_URL}/produtos/subgrupo/24/catalogo?limit=24&em_estoque=true&com_preco=false`),
          buscarJson(`${API_URL}/produtos?subgrupo=24&limit=24&em_estoque=true&com_preco=false`),
        ])

        const produtos = deduplicarProdutos(
          tentativas.flatMap((resultado) =>
            resultado.status === 'fulfilled' ? resultado.value?.produtos || [] : []
          )
        ).filter((produto) => Number(produto?.subgrupo || 0) === 24)

        if (!cancelado) {
          setEstado({
            carregando: false,
            produtos,
            erro: '',
          })
        }
      } catch (erro) {
        if (!cancelado) {
          setEstado({
            carregando: false,
            produtos: [],
            erro: erro instanceof Error ? erro.message : 'Falha ao carregar vitrine.',
          })
        }
      }
    }

    carregar()

    return () => {
      cancelado = true
    }
  }, [])

  return (
    <section className="bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-primary">Destaque</div>
            <h2 className="mt-2 text-3xl font-black uppercase text-gray-900">Produtos do subgrupo 24</h2>
            <p className="mt-2 max-w-2xl text-sm text-gray-500">
              Vitrine isolada da home, carregada separadamente com filtro exclusivo do subgrupo 24.
            </p>
          </div>
          <Link
            href="/produtos?subgrupo=24"
            className="rounded-2xl border border-gray-300 px-5 py-3 text-sm font-black uppercase tracking-wide text-gray-700 transition hover:border-primary hover:text-primary"
          >
            Ver mais
          </Link>
        </div>

        {estado.carregando ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
            <div className="text-sm font-black uppercase tracking-wide text-gray-700">Carregando produtos em destaque...</div>
          </div>
        ) : estado.erro ? (
          <div className="rounded-3xl border border-dashed border-red-200 bg-red-50 px-6 py-10 text-center">
            <div className="text-sm font-black uppercase tracking-wide text-red-700">Nao foi possivel carregar a vitrine.</div>
            <div className="mt-2 text-sm text-red-600">{estado.erro}</div>
          </div>
        ) : estado.produtos.length ? (
          <>
            <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-primary">
              {estado.produtos.length} produto{estado.produtos.length !== 1 ? 's' : ''} encontrado
              {estado.produtos.length !== 1 ? 's' : ''} no subgrupo 24.
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {estado.produtos.map((produto) => (
                <ProductCard key={`subgrupo24-${produto.id}`} produto={produto} badgeLabel="Subgrupo 24" />
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
            <div className="text-sm font-black uppercase tracking-wide text-gray-700">Nao ha produto em destaque no momento.</div>
            <div className="mt-2 text-sm text-gray-500">
              A vitrine foi carregada, mas a API nao retornou itens do subgrupo 24 nesse ambiente.
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
