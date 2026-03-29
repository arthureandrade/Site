'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { API_URL, getAdminHomeConfig, getProdutos, salvarSecaoHome, uploadAssetHome } from '@/lib/api'
import { ADMIN_PASSWORD, lerAdminCookie } from '@/lib/adminAuth'

const SECOES = [
  { key: 'featured', label: 'Produtos em destaque' },
  { key: 'best_sellers', label: 'Mais vendidos' },
  { key: 'offers', label: 'Ofertas' },
  { key: 'obra', label: 'Produtos para obra' },
  { key: 'estruturas', label: 'Ferro e Aco (secao 6)' },
  { key: 'ferragens', label: 'Ferragens' },
]

function lerSenha() {
  if (typeof window === 'undefined') return ''
  return window.sessionStorage.getItem('admin_password') || lerAdminCookie() || ''
}

export default function AdminHomeManager() {
  const heroFixos = ['/Hero/hero1.jpeg', '/Hero/hero2.jpeg', '/Hero/hero3.jpeg']
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [config, setConfig] = useState(null)
  const [secaoAtiva, setSecaoAtiva] = useState(SECOES[0].key)
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [heroPreviews] = useState(heroFixos)
  const [logoPreview, setLogoPreview] = useState('')

  useEffect(() => {
    const senha = lerSenha()
    if (senha !== ADMIN_PASSWORD) {
      router.replace('/acesso')
      return
    }
    window.sessionStorage.setItem('admin_password', ADMIN_PASSWORD)
    setPassword(ADMIN_PASSWORD)
    carregarConfig(ADMIN_PASSWORD)
  }, [router])

  async function carregarConfig(senha) {
    setCarregando(true)
    const data = await getAdminHomeConfig(senha)
    if (!data) {
      window.sessionStorage.removeItem('admin_password')
      router.replace('/acesso')
      return
    }
    setConfig(data)
    setLogoPreview(data.logo_url ? `${API_URL}${data.logo_url}` : '')
    setCarregando(false)
  }

  useEffect(() => {
    if (!password) return
    const timer = setTimeout(async () => {
      const data = await getProdutos({ busca, com_preco: true, em_estoque: true, limit: 24 })
      setResultados(data.produtos || [])
    }, 300)
    return () => clearTimeout(timer)
  }, [busca, password])

  const produtosSecao = useMemo(() => {
    return config?.sections?.[secaoAtiva]?.products || []
  }, [config, secaoAtiva])

  function atualizarProdutosSecao(produtos) {
    setConfig((current) => ({
      ...current,
      sections: {
        ...current.sections,
        [secaoAtiva]: {
          product_ids: produtos.map((item) => item.id),
          products: produtos,
        },
      },
    }))
  }

  function adicionarProduto(produto) {
    if (produtosSecao.some((item) => item.id === produto.id)) return
    atualizarProdutosSecao([...produtosSecao, produto])
  }

  function removerProduto(produtoId) {
    atualizarProdutosSecao(produtosSecao.filter((item) => item.id !== produtoId))
  }

  function moverProduto(indice, direcao) {
    const destino = indice + direcao
    if (destino < 0 || destino >= produtosSecao.length) return
    const proxima = [...produtosSecao]
    const [item] = proxima.splice(indice, 1)
    proxima.splice(destino, 0, item)
    atualizarProdutosSecao(proxima)
  }

  async function salvarSecaoAtual() {
    setSalvando(true)
    setMensagem('')
    const items = produtosSecao.map((item, index) => ({ product_id: item.id, sort_order: index }))
    const data = await salvarSecaoHome(password, secaoAtiva, items)
    if (data) {
      setConfig(data)
      setMensagem('Secao salva com sucesso.')
    } else {
      setMensagem('Nao foi possivel salvar a secao.')
    }
    setSalvando(false)
  }

  async function handleUpload(assetKey, file) {
    if (!file) return
    setMensagem('')
    const preview = URL.createObjectURL(file)
    if (assetKey === 'logo') setLogoPreview(preview)

    const data = await uploadAssetHome(password, assetKey, file)
    if (data?.config) {
      setConfig(data.config)
      setMensagem('Logo atualizada.')
      if (assetKey === 'logo') setLogoPreview(`${API_URL}${data.url}`)
    } else {
      setMensagem('Nao foi possivel enviar o arquivo.')
    }
  }

  if (carregando || !config) {
    return <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">Carregando painel...</div>
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.28em] text-primary">Area administrativa</div>
          <h1 className="mt-2 text-3xl font-black uppercase text-gray-900">Controle da homepage</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-500">
            Selecione os produtos de cada vitrine, altere o hero principal e troque a logo sem precisar editar codigo.
          </p>
        </div>
        {mensagem && <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">{mensagem}</div>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-[0.24em] text-gray-900">Hero principal</h2>
            <p className="mt-2 text-xs text-gray-500">O hero agora vem de arquivos locais da pasta <strong>public/Hero</strong>.</p>
            <div className="mt-4 space-y-4">
              {[1, 2, 3].map((numero) => (
                <div key={numero} className="rounded-2xl border border-gray-100 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-xs font-black uppercase tracking-[0.2em] text-gray-700">Slide {numero}</div>
                    <div className="text-[11px] text-gray-400">1920x800 recomendado</div>
                  </div>
                  <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-gray-100">
                    {heroPreviews[numero - 1] ? (
                      <Image src={heroPreviews[numero - 1]} alt={`Preview hero ${numero}`} fill unoptimized className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-gray-400">Sem imagem</div>
                    )}
                  </div>
                  <div className="mt-3 text-xs text-gray-500">
                    Arquivo usado: <strong>{`public/Hero/hero${numero}.jpeg`}</strong>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl bg-gray-50 p-4 text-xs text-gray-600">
              Para trocar as imagens, substitua os arquivos <strong>hero1.jpeg</strong>, <strong>hero2.jpeg</strong> e <strong>hero3.jpeg</strong> na pasta <strong>public/Hero</strong> e publique o site novamente.
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-[0.24em] text-gray-900">Logo do site</h2>
            <p className="mt-2 text-xs text-gray-500">Tamanho recomendado: 300x100 px. PNG horizontal com fundo transparente.</p>
            <div className="relative mt-4 flex h-28 items-center justify-center overflow-hidden rounded-2xl bg-gray-100">
              {logoPreview ? (
                <Image src={logoPreview} alt="Preview logo" fill unoptimized className="object-contain p-4" />
              ) : (
                <div className="text-sm text-gray-400">Sem logo enviada</div>
              )}
            </div>
            <label className="mt-4 inline-flex cursor-pointer rounded-2xl border border-gray-300 px-4 py-3 text-sm font-black uppercase tracking-wide text-gray-700">
              Enviar nova logo
              <input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={(e) => handleUpload('logo', e.target.files?.[0])} />
            </label>
          </div>
        </aside>

        <section className="space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {SECOES.map((secao) => (
                <button
                  key={secao.key}
                  onClick={() => setSecaoAtiva(secao.key)}
                  className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-wide ${
                    secaoAtiva === secao.key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {secao.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black uppercase text-gray-900">
                    Produtos da secao
                  </h2>
                  <p className="text-sm text-gray-500">{SECOES.find((item) => item.key === secaoAtiva)?.label}</p>
                </div>
                <button
                  onClick={salvarSecaoAtual}
                  disabled={salvando}
                  className="rounded-2xl bg-primary px-4 py-3 text-sm font-black uppercase tracking-wide text-white disabled:opacity-60"
                >
                  {salvando ? 'Salvando...' : 'Salvar secao'}
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {produtosSecao.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-400">
                    Nenhum produto selecionado nesta secao.
                  </div>
                ) : (
                  produtosSecao.map((produto, index) => (
                    <div key={produto.id} className="flex items-center gap-3 rounded-2xl border border-gray-100 p-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-xs font-black text-gray-500">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-gray-900">{produto.nome}</div>
                        <div className="text-xs text-gray-400">Cod. {produto.id}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => moverProduto(index, -1)} className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-black">
                          ↑
                        </button>
                        <button onClick={() => moverProduto(index, 1)} className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-black">
                          ↓
                        </button>
                        <button onClick={() => removerProduto(produto.id)} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-black text-primary">
                          Remover
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black uppercase text-gray-900">Buscar produtos</h2>
              <p className="mt-1 text-sm text-gray-500">Pesquise por nome e clique em adicionar.</p>
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Ex: tubo, parafuso, ferro..."
                className="input mt-4"
              />

              <div className="mt-5 space-y-3">
                {resultados.map((produto) => (
                  <div key={produto.id} className="flex items-center gap-3 rounded-2xl border border-gray-100 p-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-gray-900">{produto.nome}</div>
                      <div className="text-xs text-gray-400">
                        Cod. {produto.id} {produto.marca ? `• ${produto.marca}` : ''}
                      </div>
                    </div>
                    <button
                      onClick={() => adicionarProduto(produto)}
                      className="rounded-xl bg-primary px-3 py-2 text-xs font-black uppercase tracking-wide text-white"
                    >
                      Adicionar
                    </button>
                  </div>
                ))}
                {busca && resultados.length === 0 && <div className="text-sm text-gray-400">Nenhum produto encontrado.</div>}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
