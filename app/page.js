import Link from 'next/link'
import ProductCard from '@/components/ProductCard'
import { getProdutos, getProdutosDestaque } from '@/lib/api'

export const metadata = {
  title: 'Galpao do Aco | Material de construcao, ferragens e aco',
}

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP || '559532240115'

function IconTruck() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10h4m6 0h4m-7 0H9"
      />
    </svg>
  )
}

function IconShield() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  )
}

function IconCard() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M3 10h18M7 15h1m3 0h2m8-9H3a2 2 0 00-2 2v8a2 2 0 002 2h18a2 2 0 002-2V8a2 2 0 00-2-2z"
      />
    </svg>
  )
}

function IconBolt() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    </svg>
  )
}

export default async function HomePage() {
  const [{ total }, { produtos: destaques }] = await Promise.all([
    getProdutos({ em_estoque: true, limit: 1 }),
    getProdutosDestaque({ limit: 8, meses: 3, preco_min: 100 }),
  ])

  return (
    <>
      <section className="border-b border-red-800 bg-[#a40000] py-2 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-6 px-4 text-[11px] font-black uppercase tracking-[0.22em] sm:justify-between sm:px-6">
          <span>Estoque real do ERP</span>
          <span className="hidden sm:inline">Material para obra, serralheria e manutencao</span>
          <span>Compra em 10x sem juros</span>
        </div>
      </section>

      <section
        className="relative overflow-hidden bg-brand"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(10,10,14,0.92) 0%, rgba(10,10,14,0.86) 34%, rgba(10,10,14,0.42) 62%, rgba(10,10,14,0.18) 100%), url('/hero-equipe-galpao.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(204,0,0,0.28),transparent_28%)]" />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.15fr_0.85fr] md:py-20">
          <div className="relative z-10">
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-white">
              Loja completa para sua obra
            </span>

            <h1 className="mt-6 max-w-3xl text-4xl font-black uppercase leading-[0.95] text-white sm:text-5xl lg:text-7xl">
              Aco e material de construcao com entrega rapida
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-gray-200 sm:text-xl">
              Estoque real, preco atualizado e atendimento imediato no WhatsApp para obra, serralheria e manutencao.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/produtos" className="btn-primary px-8 py-4 text-base font-black uppercase tracking-wide">
                Ver catalogo
              </Link>
              <a
                href={`https://wa.me/${WHATSAPP}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline border-white/20 bg-black/35 px-8 py-4 text-base font-black uppercase tracking-wide text-white hover:bg-white/10"
              >
                Falar no WhatsApp
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {['Parcelamento em 10x', 'Entrega em Boa Vista', 'Pedido rapido'].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-gray-200"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative z-10 grid gap-4 self-end sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
            {[
              { titulo: 'Produtos ativos', valor: total > 0 ? `${total.toLocaleString('pt-BR')}+` : '4.000+' },
              { titulo: 'Compra online', valor: '10x sem juros' },
              { titulo: 'Atendimento', valor: 'Resposta rapida' },
              { titulo: 'Retirada', valor: 'Pronta entrega' },
            ].map((item) => (
              <div key={item.titulo} className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-sm">
                <div className="text-[11px] font-black uppercase tracking-[0.24em] text-gray-300">{item.titulo}</div>
                <div className="mt-3 text-2xl font-black uppercase text-white">{item.valor}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {[
            { icon: <IconTruck />, titulo: 'Entrega agil', texto: 'Despacho rapido para a sua obra.' },
            { icon: <IconCard />, titulo: '10x sem juros', texto: 'Parcela exibida em todo o catalogo.' },
            { icon: <IconShield />, titulo: 'Compra segura', texto: 'Estoque e preco atualizados no ERP.' },
            { icon: <IconBolt />, titulo: 'Atendimento rapido', texto: 'Pedido e cotacao pelo WhatsApp.' },
          ].map((item) => (
            <div key={item.titulo} className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white">{item.icon}</div>
              <div>
                <div className="text-sm font-black uppercase tracking-wide text-gray-900">{item.titulo}</div>
                <div className="mt-1 text-sm text-gray-500">{item.texto}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {destaques.length > 0 && (
        <section className="bg-[#f5f6f8] py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="text-[11px] font-black uppercase tracking-[0.28em] text-primary">Mais vendidos</span>
                <h2 className="mt-2 text-3xl font-black uppercase text-gray-900 sm:text-4xl">
                  Produtos em destaque
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-gray-500">
                  Selecionados pelo maior faturamento dos ultimos 3 meses, com preco atual acima de R$ 100 e estoque disponivel.
                </p>
              </div>

              <Link href="/produtos" className="btn-outline whitespace-nowrap px-5 py-3 text-sm font-black uppercase tracking-wide">
                Ver todos os produtos
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {destaques.map((produto) => (
                <ProductCard key={produto.id} produto={produto} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-white py-14">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] bg-brand p-8 text-white shadow-2xl">
            <span className="text-[11px] font-black uppercase tracking-[0.28em] text-primary">Venda assistida</span>
            <h2 className="mt-3 text-3xl font-black uppercase sm:text-4xl">Monte seu pedido com nossa equipe</h2>
            <p className="mt-4 max-w-xl text-gray-300">
              Envie sua lista no WhatsApp e receba atendimento rapido para cotacao, separacao e retirada.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={`https://wa.me/${WHATSAPP}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl bg-green-500 px-6 py-4 text-sm font-black uppercase tracking-wide text-white transition hover:bg-green-600"
              >
                Chamar no WhatsApp
              </a>
              <Link
                href="/produtos"
                className="rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-sm font-black uppercase tracking-wide text-white transition hover:bg-white/10"
              >
                Navegar no catalogo
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {[
              { titulo: 'Acos e perfis', texto: 'Tubos, chapas, barras, vergalhoes e muito mais.' },
              { titulo: 'Ferragens e fixacao', texto: 'Parafusos, fechaduras, cadeados e acessorios.' },
              { titulo: 'Maquinas e ferramentas', texto: 'Linhas profissionais para obra e oficina.' },
            ].map((item) => (
              <div key={item.titulo} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="text-sm font-black uppercase tracking-wide text-gray-900">{item.titulo}</div>
                <div className="mt-2 text-sm leading-relaxed text-gray-500">{item.texto}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
