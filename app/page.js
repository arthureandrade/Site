import Link from 'next/link'
import ProductCard from '@/components/ProductCard'
import { API_URL, getHomeConfig, getProdutos, getProdutosDestaque } from '@/lib/api'

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

function escolherProdutos(config, sectionKey, fallback) {
  const selecionados = config?.sections?.[sectionKey]?.products || []
  return selecionados.length > 0 ? selecionados : fallback
}

function SectionShelf({ title, subtitle, href, produtos, badge = null, cardBadgeLabel = '' }) {
  if (!produtos?.length) return null

  return (
    <section className="bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-primary">{badge || 'Vitrine'}</div>
            <h2 className="mt-2 text-3xl font-black uppercase text-gray-900">{title}</h2>
            {subtitle && <p className="mt-2 max-w-2xl text-sm text-gray-500">{subtitle}</p>}
          </div>
          <Link href={href} className="rounded-2xl border border-gray-300 px-5 py-3 text-sm font-black uppercase tracking-wide text-gray-700 transition hover:border-primary hover:text-primary">
            Ver mais
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {produtos.map((produto) => (
            <ProductCard key={`${title}-${produto.id}`} produto={produto} badgeLabel={cardBadgeLabel} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default async function HomePage() {
  const [config, destaqueData, subgrupo24Data, estruturasData, ferragensData] = await Promise.all([
    getHomeConfig(),
    getProdutosDestaque({ limit: 12, meses: 3, preco_min: 100 }),
    getProdutos({ subgrupo: 24, em_estoque: true, com_preco: true, limit: 10 }),
    getProdutos({ busca: 'estrutura', em_estoque: true, com_preco: true, limit: 10 }),
    getProdutos({ busca: 'ferragem', em_estoque: true, com_preco: true, limit: 10 }),
  ])

  const destaques = destaqueData.produtos || []
  const featured = escolherProdutos(config, 'featured', destaques.slice(0, 10))
  const bestSellers = escolherProdutos(config, 'best_sellers', destaques.slice(0, 10))
  const offers = escolherProdutos(config, 'offers', destaqueData.produtos?.slice(2, 12) || [])
  const destaqueSubgrupo = escolherProdutos(config, 'obra', subgrupo24Data.produtos || [])
  const estruturas = escolherProdutos(config, 'estruturas', estruturasData.produtos || [])
  const ferragens = escolherProdutos(config, 'ferragens', ferragensData.produtos || [])
  const heroImage = config?.hero_image_url ? `${API_URL}${config.hero_image_url}` : null

  return (
    <>
      <section className="border-b border-red-700 bg-primary py-2 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 text-[11px] font-black uppercase tracking-[0.22em] sm:px-6">
          <span>{TELEFONE}</span>
          <span className="hidden sm:inline">Av. Ataide Teive, 5928</span>
          <span className="hidden lg:inline">Av. Ataide Teive, 4509</span>
        </div>
      </section>

      <section
        className="relative overflow-hidden border-b border-gray-200 bg-[#111]"
        style={{
          backgroundImage: heroImage
            ? `linear-gradient(90deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.72) 38%, rgba(0,0,0,0.25) 72%, rgba(0,0,0,0.12) 100%), url('${heroImage}')`
            : 'linear-gradient(90deg, rgba(17,17,17,1) 0%, rgba(17,17,17,0.92) 35%, rgba(17,17,17,0.78) 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
          <div className="relative z-10">
            <span className="inline-flex rounded-full bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-white">
              Home comercial
            </span>
            <h1 className="mt-6 max-w-3xl text-4xl font-black uppercase leading-[0.96] text-white sm:text-5xl lg:text-6xl">
              {config?.hero_title || 'Ofertas em aco para sua obra'}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-gray-200">
              {config?.hero_subtitle || 'Estoque real, preco atualizado e atendimento rapido no WhatsApp.'}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/produtos" className="rounded-2xl bg-primary px-7 py-4 text-sm font-black uppercase tracking-wide text-white transition hover:bg-red-700">
                Comprar agora
              </Link>
              <a
                href={`https://wa.me/${WHATSAPP}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl border border-white/20 bg-black/35 px-7 py-4 text-sm font-black uppercase tracking-wide text-white transition hover:bg-white/10"
              >
                Falar no WhatsApp
              </a>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { titulo: '+ clientes atendidos', valor: 'Milhares' },
              { titulo: 'Grande estoque', valor: 'Sempre ativo' },
              { titulo: 'Parcelamento', valor: '10x sem juros' },
              { titulo: 'Atendimento', valor: 'Resposta rapida' },
            ].map((item) => (
              <div key={item.titulo} className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
                <div className="text-[11px] font-black uppercase tracking-[0.22em] text-gray-300">{item.titulo}</div>
                <div className="mt-3 text-2xl font-black uppercase text-white">{item.valor}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-6">
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-primary">Categorias principais</div>
            <h2 className="mt-2 text-3xl font-black uppercase text-gray-900">Compre por linha de produto</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {CATEGORIAS.map((categoria) => (
              <Link
                key={categoria.nome}
                href={categoria.href || `/produtos?busca=${encodeURIComponent(categoria.busca)}`}
                className="group overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className={`h-28 bg-gradient-to-br ${categoria.cor}`} />
                <div className="p-4">
                  <div className="text-sm font-black uppercase tracking-wide text-gray-900">{categoria.nome}</div>
                  <div className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Ver produtos</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SectionShelf
        title="Produtos em destaque"
        subtitle="Selecao principal da home para empurrar clique e navegação."
        href="/produtos"
        produtos={featured}
        badge="Destaques"
      />

      <SectionShelf
        title="Mais vendidos"
        subtitle="Itens com maior giro recente para acelerar a decisao de compra."
        href="/produtos"
        produtos={bestSellers}
        badge="Mais vendidos"
      />

      <SectionShelf
        title="Ofertas e promocoes"
        subtitle="Bloco promocional para dar contraste visual e aumentar conversao."
        href="/produtos"
        produtos={offers}
        badge="Oferta"
        cardBadgeLabel="Oferta"
      />

      <SectionShelf
        title="Destaque"
        subtitle="Produtos do subgrupo 24 para empurrar venda e visibilidade na home."
        href="/produtos?subgrupo=24"
        produtos={destaqueSubgrupo}
        badge="Destaque"
      />

      <SectionShelf
        title="Linhas de produto: estruturas metalicas"
        subtitle="Perfis, estruturas e itens de sustentacao."
        href="/produtos?busca=estrutura"
        produtos={estruturas}
        badge="Linhas"
      />

      <SectionShelf
        title="Linhas de produto: ferragens"
        subtitle="Parafusos, fechaduras, fixacao e acessorios."
        href="/produtos?busca=ferragem"
        produtos={ferragens}
        badge="Linhas"
      />

      <section className="bg-[#f6f7f8] py-14">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-3">
          {[
            { titulo: '+X clientes atendidos', texto: 'Atendimento comercial rapido para obras, oficinas e serralherias.' },
            { titulo: 'Grande estoque disponivel', texto: 'Produtos ativos com consulta de preco e estoque integrada ao ERP.' },
            { titulo: 'Compra agil no WhatsApp', texto: 'Peça seu orcamento e feche o pedido com resposta mais rapida.' },
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
