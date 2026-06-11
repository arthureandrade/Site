import Link from 'next/link'
import fs from 'fs'
import path from 'path'
import HeroCarousel from '@/components/HeroCarousel'
import PersonalizedHomeShelf from '@/components/PersonalizedHomeShelf'
import SaldaoCarousel from '@/components/SaldaoCarousel'
import TrackedWhatsAppLink from '@/components/TrackedWhatsAppLink'
import VitrineSubgrupo24 from '@/components/VitrineSubgrupo24'
import { getCatalogoCompletoComFallback, getHomeConfig } from '@/lib/api'
import { PUBLIC_CACHE_SECONDS } from '@/lib/cacheConfig'

export const metadata = {
  title: 'Galpão do Aço | Material de construção, ferragens e aço',
}
export const revalidate = 900

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP || '559532240115'
const TELEFONE = '(95) 3224-0115'
const HERO_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp']
const HOME_BACKGROUND_END_DATE = '2026-07-20T23:59:59-04:00'

const CATEGORIAS = [
  { nome: 'Ferro e aço', href: '/produtos?categoria=ferro_aco', cor: 'from-slate-900 to-slate-700' },
  { nome: 'Ferragens', busca: 'ferragem', cor: 'from-red-700 to-red-500' },
  { nome: 'Telhas', busca: 'telha', cor: 'from-neutral-800 to-neutral-600' },
  { nome: 'Parafusos', busca: 'parafuso', cor: 'from-zinc-800 to-zinc-600' },
  { nome: 'Estruturas', busca: 'estrutura', cor: 'from-black to-gray-700' },
  { nome: 'Máquinas', busca: 'maquina', cor: 'from-red-900 to-red-600' },
]

function getHeroSlides() {
  const heroDir = path.join(process.cwd(), 'heros')
  const slides = []

  for (const numero of [1, 2, 3, 4]) {
    const extensao = HERO_EXTENSIONS.find((ext) =>
      fs.existsSync(path.join(heroDir, `hero${numero}.${ext}`))
    )

    if (extensao) {
      slides.push(`/hero-assets/hero${numero}.${extensao}`)
    }
  }

  return slides
}

function getHomeBackgroundImage() {
  if (Date.now() > new Date(HOME_BACKGROUND_END_DATE).getTime()) return ''

  const heroDir = path.join(process.cwd(), 'heros')
  const extensao = HERO_EXTENSIONS.find((ext) => fs.existsSync(path.join(heroDir, `back.${ext}`)))

  return extensao ? `/hero-assets/back.${extensao}` : ''
}

export default async function HomePage() {
  const [config, catalogoCompleto] = await Promise.all([
    getHomeConfig(),
    getCatalogoCompletoComFallback({ revalidate: PUBLIC_CACHE_SECONDS }),
  ])
  const produtosHome = (catalogoCompleto || []).filter((produto) => {
    const secao = Number(produto?.secao || 0)
    const ramassol = String(produto?.marca || '').toLowerCase().includes('ramassol')
    const comercialmenteValido = secao === 6 || Number(produto?.preco || 0) > 0
    return (secao === 5 || secao === 6 || secao === 14 || ramassol) && comercialmenteValido
  })
  const heroSlides = getHeroSlides()
  const homeBackgroundImage = getHomeBackgroundImage()
  const produtosMap = new Map()
  const produtosMotorizadasMap = new Map()
  const produtosMaisVendidosMap = new Map()
  const produtosFazendaMap = new Map()
  const produtosFerramentasProfissionaisMap = new Map()
  const produtosSoldaMap = new Map()
  const produtosSaldaoMap = new Map()

  for (const produto of produtosHome) {
    if (!produto?.id) continue
    const subgrupo = Number(produto.subgrupo || 0)
    if (subgrupo === 24) {
      produtosMap.set(Number(produto.id), produto)
    }
    if (subgrupo === 29) {
      produtosMotorizadasMap.set(Number(produto.id), produto)
    }
    if (subgrupo === 26) {
      produtosMaisVendidosMap.set(Number(produto.id), produto)
    }
    if (subgrupo === 28) {
      produtosFazendaMap.set(Number(produto.id), produto)
    }
    if (subgrupo === 27) {
      produtosFerramentasProfissionaisMap.set(Number(produto.id), produto)
    }
    if (subgrupo === 30) {
      produtosSoldaMap.set(Number(produto.id), produto)
    }
    if (subgrupo === 25) {
      produtosSaldaoMap.set(Number(produto.id), produto)
    }
  }

  const produtosSubgrupo29 = Array.from(produtosMotorizadasMap.values()).slice(0, 10)
  const produtosSubgrupo26 = Array.from(produtosMaisVendidosMap.values()).slice(0, 10)
  const produtosSubgrupo24 = Array.from(produtosMap.values()).slice(0, 10)
  const produtosSubgrupo28 = Array.from(produtosFazendaMap.values()).slice(0, 10)
  const produtosSubgrupo27 = Array.from(produtosFerramentasProfissionaisMap.values()).slice(0, 10)
  const produtosSubgrupo30 = Array.from(produtosSoldaMap.values()).slice(0, 10)
  const produtosSubgrupo25 = Array.from(produtosSaldaoMap.values())
  const produtosPersonalizacao = Array.from(
    new Map(
      produtosHome
        .filter((produto) => Number(produto?.secao || 0) !== 6)
        .filter((produto) => produto?.id && Number(produto?.preco || 0) > 0)
        .map((produto) => [Number(produto.id), produto])
    ).values()
  ).slice(0, 800)
  const totalCatalogoBase = produtosHome.length
  const origemSubgrupo29 = produtosSubgrupo29.length
    ? `base secoes 5, 6, 14 + Ramassol (${totalCatalogoBase} itens analisados)`
    : 'sem retorno'
  const origemSubgrupo26 = produtosSubgrupo26.length
    ? `base secoes 5, 6, 14 + Ramassol (${totalCatalogoBase} itens analisados)`
    : 'sem retorno'
  const origemSubgrupo24 = produtosSubgrupo24.length
    ? `base secoes 5, 6, 14 + Ramassol (${totalCatalogoBase} itens analisados)`
    : 'sem retorno'
  const origemSubgrupo28 = produtosSubgrupo28.length
    ? `base secoes 5, 6, 14 + Ramassol (${totalCatalogoBase} itens analisados)`
    : 'sem retorno'
  const origemSubgrupo27 = produtosSubgrupo27.length
    ? `base secoes 5, 6, 14 + Ramassol (${totalCatalogoBase} itens analisados)`
    : 'sem retorno'
  const origemSubgrupo30 = produtosSubgrupo30.length
    ? `base secoes 5, 6, 14 + Ramassol (${totalCatalogoBase} itens analisados)`
    : 'sem retorno'

  return (
    <div className="relative isolate overflow-hidden bg-[#f7f8fa] md:bg-transparent">
      {homeBackgroundImage ? (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(185,28,28,0.08),transparent_32%),linear-gradient(180deg,#ffffff_0%,#f7f8fa_100%)] md:hidden"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 -z-10 hidden bg-cover bg-center bg-no-repeat md:block"
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.72), rgba(255,255,255,0.9)), url("${homeBackgroundImage}")`,
              backgroundAttachment: 'fixed',
            }}
          />
        </>
      ) : null}

      <div className="relative z-10">
      <section className="border-b border-red-700 bg-primary py-2 text-white">
        <div className="mx-auto flex max-w-[1760px] items-center justify-between px-4 text-[11px] font-black uppercase tracking-[0.22em] sm:px-6 lg:px-8">
          <span>{TELEFONE}</span>
          <span className="hidden sm:inline">Av. Ataíde Teive, 5928</span>
          <span className="hidden lg:inline">Av. Ataíde Teive, 4509</span>
        </div>
      </section>

      <HeroCarousel
        images={heroSlides}
        title={config?.hero_title || 'Ofertas em aço para sua obra'}
        subtitle={config?.hero_subtitle || 'Estoque real, preço atualizado e atendimento rápido no WhatsApp.'}
      />

      <PersonalizedHomeShelf produtos={produtosPersonalizacao} />

      <VitrineSubgrupo24
        sectionId="ferramentas-motorizadas"
        produtos={produtosSubgrupo29}
        origem={origemSubgrupo29}
        label="Ferramentas motorizadas"
        titulo="Potência, torque e corte pesado para quem precisa produzir mais"
        descricao="Uma vitrine mais técnica para motores, cortes, impacto e equipamentos que pedem mais desempenho no trabalho pesado."
        href="/produtos?subgrupo=29"
        cta="Ver linha motorizada"
        desconto={14}
        badge="Alta potência"
        vazioTitulo="Não há ferramenta motorizada em destaque no momento."
        resumo={`${produtosSubgrupo29.length} item${produtosSubgrupo29.length !== 1 ? 's' : ''} motorizado${produtosSubgrupo29.length !== 1 ? 's' : ''} reunido${produtosSubgrupo29.length !== 1 ? 's' : ''} em uma vitrine técnica de alta demanda.`}
        tema="motor"
        cardVariant="motor"
      />

      <VitrineSubgrupo24
        sectionId="mais-vendidos-obra"
        produtos={produtosSubgrupo26}
        origem={origemSubgrupo26}
        label="Mais vendidos da obra"
        titulo="Os itens que mais giram para obra e reposição rápida"
        descricao="Os produtos que mais saem para obra, reforma e manutenção, reunidos para facilitar sua compra."
        href="/produtos?subgrupo=26"
        cta="Ver mais vendidos"
        desconto={12}
        badge="Giro forte"
        vazioTitulo="Não há item de giro forte no momento."
        resumo={`${produtosSubgrupo26.length} item${produtosSubgrupo26.length !== 1 ? 's' : ''} com giro forte em destaque para acelerar a compra.`}
      />

      <VitrineSubgrupo24
        produtos={produtosSubgrupo24}
        origem={origemSubgrupo24}
        descricao="Ofertas online selecionadas para você economizar e comprar com mais agilidade."
        resumo={`${produtosSubgrupo24.length} oferta${produtosSubgrupo24.length !== 1 ? 's' : ''} em destaque carregada${produtosSubgrupo24.length !== 1 ? 's' : ''} para compra online.`}
      />

      <VitrineSubgrupo24
        sectionId="produtos-fazenda"
        produtos={produtosSubgrupo28}
        origem={origemSubgrupo28}
        label="Produtos para fazenda"
        titulo="Seleção comercial para fazenda, manejo e rotina do campo"
        descricao="Itens escolhidos para facilitar a compra de produtos ligados ao trabalho rural e ao dia a dia da fazenda."
        href="/produtos?subgrupo=28"
        cta="Ver linha fazenda"
        desconto={14}
        badge="Campo"
        vazioTitulo="Não há produto para fazenda em destaque no momento."
        resumo={`${produtosSubgrupo28.length} item${produtosSubgrupo28.length !== 1 ? 's' : ''} da linha fazenda com 14% de desconto online.`}
        tema="green"
        cardVariant="farm"
      />

      <VitrineSubgrupo24
        sectionId="ferramentas-profissionais"
        produtos={produtosSubgrupo27}
        origem={origemSubgrupo27}
        label="Ferramentas profissionais"
        titulo="Linha profissional para uso intenso e compra mais técnica"
        descricao="Ferramentas escolhidas para quem precisa de desempenho, durabilidade e resultado no dia a dia."
        href="/produtos?subgrupo=27"
        cta="Ver ferramentas"
        desconto={12}
        badge="Profissional"
        vazioTitulo="Não há ferramenta profissional em destaque no momento."
        resumo={`${produtosSubgrupo27.length} ferramenta${produtosSubgrupo27.length !== 1 ? 's' : ''} profissional${produtosSubgrupo27.length !== 1 ? 'is' : ''} em destaque na vitrine.`}
      />

      <VitrineSubgrupo24
        sectionId="maquinas-de-solda"
        produtos={produtosSubgrupo30}
        origem={origemSubgrupo30}
        label="Maquinas de solda"
        titulo="Linha de solda com oferta online para acelerar a compra técnica"
        descricao="Selecionamos máquinas de solda para dar mais velocidade na escolha e destacar oportunidades com desconto direto no site."
        href="/produtos?subgrupo=30"
        cta="Ver máquinas de solda"
        desconto={14}
        badge="Solda"
        vazioTitulo="Não há máquina de solda em destaque no momento."
        resumo={`${produtosSubgrupo30.length} item${produtosSubgrupo30.length !== 1 ? 's' : ''} da linha de solda com 14% de desconto online.`}
      />

      <section className="bg-white py-4 md:bg-white/90 md:backdrop-blur-sm sm:py-5">
        <div className="mx-auto grid max-w-[1760px] gap-4 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          {[
            { titulo: 'Operacao estruturada', texto: 'Mix amplo, condicao comercial clara e atendimento preparado para volume.' },
            { titulo: 'Compra com mais confiança', texto: 'Preço, oferta e disponibilidade organizados para decisão mais rápida.' },
            { titulo: 'Atendimento comercial forte', texto: 'Equipe focada em obra, serralheria, reposição e venda recorrente.' },
          ].map((item) => (
            <div key={item.titulo} className="surface-panel rounded-[26px] px-5 py-5">
              <div className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">{item.titulo}</div>
              <div className="mt-2 text-sm leading-relaxed text-slate-600">{item.texto}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-6 md:bg-white/90 md:backdrop-blur-sm sm:py-8">
        <div className="mx-auto max-w-[1760px] px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <div className="eyebrow">Categorias principais</div>
            <h2 className="mt-3 text-xl font-black uppercase text-gray-900 sm:text-2xl">Compre por linha de produto</h2>
            <p className="mt-1.5 max-w-3xl text-[13px] leading-relaxed text-slate-600 sm:mt-2 sm:text-sm">
              Organizamos o catálogo por frentes de compra para deixar a navegação mais rápida e profissional.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
            {CATEGORIAS.map((categoria) => (
              <Link
                key={categoria.nome}
                href={categoria.href || `/produtos?busca=${encodeURIComponent(categoria.busca)}`}
                className="group overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(15,23,42,0.1)] sm:rounded-[24px]"
              >
                <div className={`h-16 bg-gradient-to-br ${categoria.cor} sm:h-24`} />
                <div className="p-3 sm:p-4">
                  <div className="text-[13px] font-black uppercase tracking-[0.06em] text-gray-900 sm:text-sm sm:tracking-[0.08em]">{categoria.nome}</div>
                  <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Ver produtos</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="saldao" className="bg-[#fff7f2] py-6 md:bg-[#fff7f2]/92 md:backdrop-blur-sm">
        <div className="mx-auto max-w-[1760px] px-4 sm:px-6 lg:px-8">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.28em] text-[#ff5a0a]">Saldão</div>
              <h2 className="mt-2 text-xl font-black uppercase text-[#13214e] sm:text-[1.9rem]">Queima online com 18% de desconto</h2>
              <p className="mt-1.5 max-w-3xl text-[13px] text-slate-600 sm:mt-2 sm:text-sm">
                Itens do subgrupo 25 em um carrossel de ofertas para girar estoque mais rápido sem perder visibilidade.
              </p>
            </div>
            <Link
              href="/produtos?subgrupo=25"
              className="inline-flex rounded-2xl border border-[#ff5a0a] px-4 py-2.5 text-xs sm:px-5 sm:py-3 sm:text-sm font-black uppercase tracking-wide text-[#ff5a0a] transition hover:bg-[#ff5a0a] hover:text-white"
            >
              Ver saldão
            </Link>
          </div>

          <SaldaoCarousel produtos={produtosSubgrupo25} />
        </div>
      </section>

      <section className="bg-[#f6f7f8] py-8 md:bg-[#f6f7f8]/92 md:backdrop-blur-sm sm:py-10">
        <div className="mx-auto grid max-w-[1760px] gap-4 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          {[
            { titulo: '+X clientes atendidos', texto: 'Atendimento comercial rápido para obras, oficinas e serralherias.' },
            { titulo: 'Grande estoque disponível', texto: 'Produtos ativos com consulta de preço e estoque integrada ao ERP.' },
            { titulo: 'Compra ágil no WhatsApp', texto: 'Peça seu orçamento e feche o pedido com resposta mais rápida.' },
          ].map((item) => (
            <div key={item.titulo} className="surface-panel rounded-[28px] p-6">
              <div className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">Confianca comercial</div>
              <div className="mt-3 text-2xl font-black uppercase tracking-[0.04em] text-gray-900">{item.titulo}</div>
              <div className="mt-3 text-sm leading-relaxed text-slate-600">{item.texto}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-brand py-10 text-white" id="contato">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <div className="eyebrow !border-white/10 !bg-white/10 !text-primary">CTA final</div>
          <h2 className="mt-3 text-3xl font-black uppercase sm:text-5xl">Peça seu orçamento agora no WhatsApp</h2>
          <p className="mt-4 text-lg text-gray-300">
            Envie sua lista de materiais e receba atendimento rápido para cotação, separação e retirada.
          </p>
          <TrackedWhatsAppLink
            href={`https://wa.me/${WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
            label="home_final_cta"
            className="mt-8 inline-flex rounded-2xl bg-green-500 px-8 py-4 text-sm font-black uppercase tracking-wide text-white transition hover:bg-green-600"
          >
            Falar com a equipe
          </TrackedWhatsAppLink>
        </div>
      </section>
      </div>
    </div>
  )
}

