import Link from 'next/link'
import HeroCarousel from '@/components/HeroCarousel'
import SaldaoCarousel from '@/components/SaldaoCarousel'
import VitrineSubgrupo24 from '@/components/VitrineSubgrupo24'
import { getHomeConfig, getProdutos } from '@/lib/api'

export const metadata = {
  title: 'Galpao do Aco | Material de construcao, ferragens e aco',
}

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP || '559532240115'
const TELEFONE = '(95) 3224-0115'

const CATEGORIAS = [
  { nome: 'Ferro e aco', href: '/produtos?categoria=ferro_aco', cor: 'from-slate-900 to-slate-700' },
  { nome: 'Ferragens', busca: 'ferragem', cor: 'from-red-700 to-red-500' },
  { nome: 'Telhas', busca: 'telha', cor: 'from-neutral-800 to-neutral-600' },
  { nome: 'Parafusos', busca: 'parafuso', cor: 'from-zinc-800 to-zinc-600' },
  { nome: 'Estruturas', busca: 'estrutura', cor: 'from-black to-gray-700' },
  { nome: 'Maquinas', busca: 'maquina', cor: 'from-red-900 to-red-600' },
]

export default async function HomePage() {
  const [config, secao5Data, secao6Data] = await Promise.all([
    getHomeConfig(),
    getProdutos({ secao: 5, em_estoque: true, com_preco: true, limit: 5000, noStore: true }),
    getProdutos({ secao: 6, em_estoque: true, com_preco: true, limit: 5000, noStore: true }),
  ])
  const heroSlides = ['/Hero/hero1.jpeg', '/Hero/hero2.jpeg', '/Hero/hero3.jpeg']
  const produtosMap = new Map()
  const produtosSaldaoMap = new Map()

  for (const produto of [...(secao5Data?.produtos || []), ...(secao6Data?.produtos || [])]) {
    if (!produto?.id) continue
    const subgrupo = Number(produto.subgrupo || 0)
    if (subgrupo === 24) {
      produtosMap.set(Number(produto.id), produto)
    }
    if (subgrupo === 25) {
      produtosSaldaoMap.set(Number(produto.id), produto)
    }
  }

  const produtosSubgrupo24 = Array.from(produtosMap.values()).slice(0, 10)
  const produtosSubgrupo25 = Array.from(produtosSaldaoMap.values())
  const origemSubgrupo24 = produtosSubgrupo24.length
    ? `base secoes 5 e 6 (${(secao5Data?.produtos || []).length + (secao6Data?.produtos || []).length} itens analisados)`
    : 'sem retorno'

  return (
    <>
      <section className="border-b border-red-700 bg-primary py-2 text-white">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 text-[11px] font-black uppercase tracking-[0.22em] sm:px-6 lg:px-8">
          <span>{TELEFONE}</span>
          <span className="hidden sm:inline">Av. Ataide Teive, 5928</span>
          <span className="hidden lg:inline">Av. Ataide Teive, 4509</span>
        </div>
      </section>

      <HeroCarousel
        images={heroSlides}
        title={config?.hero_title || 'Ofertas em aco para sua obra'}
        subtitle={config?.hero_subtitle || 'Estoque real, preco atualizado e atendimento rapido no WhatsApp.'}
      />

      <VitrineSubgrupo24 produtos={produtosSubgrupo24} origem={origemSubgrupo24} />

      <section className="bg-white py-10">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-primary">Categorias principais</div>
            <h2 className="mt-2 text-3xl font-black uppercase text-gray-900">Compre por linha de produto</h2>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
            {CATEGORIAS.map((categoria) => (
              <Link
                key={categoria.nome}
                href={categoria.href || `/produtos?busca=${encodeURIComponent(categoria.busca)}`}
                className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className={`h-20 bg-gradient-to-br ${categoria.cor}`} />
                <div className="p-3">
                  <div className="text-xs font-black uppercase tracking-wide text-gray-900 sm:text-sm">{categoria.nome}</div>
                  <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Ver produtos</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#fff7f2] py-10">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.28em] text-[#ff5a0a]">Saldão</div>
              <h2 className="mt-2 text-3xl font-black uppercase text-[#13214e]">Queima online com 18% de desconto</h2>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                Itens do subgrupo 25 em um carrossel de ofertas para girar estoque mais rapido sem perder visibilidade.
              </p>
            </div>
            <Link
              href="/produtos?subgrupo=25"
              className="inline-flex rounded-2xl border border-[#ff5a0a] px-5 py-3 text-sm font-black uppercase tracking-wide text-[#ff5a0a] transition hover:bg-[#ff5a0a] hover:text-white"
            >
              Ver saldão
            </Link>
          </div>

          <SaldaoCarousel produtos={produtosSubgrupo25} />
        </div>
      </section>

      <section className="bg-[#f6f7f8] py-14">
        <div className="mx-auto grid max-w-[1600px] gap-6 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          {[
            { titulo: '+X clientes atendidos', texto: 'Atendimento comercial rapido para obras, oficinas e serralherias.' },
            { titulo: 'Grande estoque disponivel', texto: 'Produtos ativos com consulta de preco e estoque integrada ao ERP.' },
            { titulo: 'Compra agil no WhatsApp', texto: 'Peca seu orcamento e feche o pedido com resposta mais rapida.' },
          ].map((item) => (
            <div key={item.titulo} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-black uppercase tracking-wide text-gray-900">{item.titulo}</div>
              <div className="mt-2 text-sm leading-relaxed text-gray-500">{item.texto}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-brand py-14 text-white" id="contato">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <div className="text-[11px] font-black uppercase tracking-[0.28em] text-primary">CTA final</div>
          <h2 className="mt-3 text-3xl font-black uppercase sm:text-5xl">Peca seu orcamento agora no WhatsApp</h2>
          <p className="mt-4 text-lg text-gray-300">
            Envie sua lista de materiais e receba atendimento rapido para cotacao, separacao e retirada.
          </p>
          <a
            href={`https://wa.me/${WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex rounded-2xl bg-green-500 px-8 py-4 text-sm font-black uppercase tracking-wide text-white transition hover:bg-green-600"
          >
            Falar com a equipe
          </a>
        </div>
      </section>
    </>
  )
}
