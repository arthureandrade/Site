import Link from 'next/link'
import { getProdutos, formatarPreco } from '@/lib/api'
import ProductCard from '@/components/ProductCard'

export const metadata = {
  title: 'Galpão do Aço — A Solução Certa Para Sua Obra!',
}

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP || '5500000000000'

/* ── Ícones ── */
function IconBox() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
    </svg>
  )
}
function IconTag() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
    </svg>
  )
}
function IconTruck() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10h4m6 0h4m-7 0H9"/>
    </svg>
  )
}
function IconShield() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
    </svg>
  )
}

/* ── Cards do Instagram (anúncios estilizados) ── */
const INSTAGRAM_CARDS = [
  {
    bg: '#CC0000', text: '#FFFFFF',
    tag: '🔩 FERRAGENS',
    titulo: 'PARAFUSOS\nE FIXAÇÕES',
    sub: 'Estoque completo para sua obra',
  },
  {
    bg: '#111111', text: '#FFFFFF',
    tag: '⚙️ AÇOS',
    titulo: 'BARRAS,\nPERFIS & TUBOS',
    sub: 'Corte e entrega na sua medida',
  },
  {
    bg: '#CC0000', text: '#FFFFFF',
    tag: '🏗️ CONSTRUÇÃO',
    titulo: 'TUDO PARA\nSUA OBRA',
    sub: 'Qualidade e preço garantidos',
  },
  {
    bg: '#1a1a1a', text: '#FFFFFF',
    tag: '📦 ESTOQUE REAL',
    titulo: 'MAIS DE\n1.000 PRODUTOS',
    sub: 'Atualizado direto do sistema',
  },
  {
    bg: '#CC0000', text: '#FFFFFF',
    tag: '💬 ATENDIMENTO',
    titulo: 'ORÇAMENTO\nRÁPIDO',
    sub: 'Fale agora pelo WhatsApp',
  },
  {
    bg: '#111111', text: '#FFFFFF',
    tag: '✅ QUALIDADE',
    titulo: 'A SOLUÇÃO\nCERTA',
    sub: 'Para sua obra em Boa Vista/RR',
  },
  {
    bg: '#CC0000', text: '#FFFFFF',
    tag: '🔧 FERRAMENTAS',
    titulo: 'TUDO EM\NUM LUGAR',
    sub: 'Galpão do Aço — Boa Vista/RR',
  },
  {
    bg: '#1a1a1a', text: '#FFFFFF',
    tag: '💰 MELHOR PREÇO',
    titulo: 'PREÇOS\nCOMPETITIVOS',
    sub: 'Direto do nosso sistema ERP',
  },
]

function InstagramCard({ card }) {
  return (
    <div
      className="flex-shrink-0 w-52 h-52 rounded-xl flex flex-col justify-between p-4 select-none"
      style={{ backgroundColor: card.bg }}
    >
      <div>
        <span className="text-xs font-bold uppercase tracking-widest"
              style={{ color: card.text, opacity: 0.75 }}>
          {card.tag}
        </span>
        <h3 className="font-display text-2xl mt-1 leading-tight whitespace-pre-line"
            style={{ color: card.text }}>
          {card.titulo}
        </h3>
      </div>
      <div className="flex items-end justify-between">
        <p className="text-xs font-semibold" style={{ color: card.text, opacity: 0.8 }}>
          {card.sub}
        </p>
        {/* Instagram logo */}
        <svg className="w-6 h-6 opacity-60" style={{ fill: card.text }} viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      </div>
    </div>
  )
}

export default async function HomePage() {
  const { total, produtos: destaques } = await getProdutos({ em_estoque: true, limit: 8 })

  const doubled = [...INSTAGRAM_CARDS, ...INSTAGRAM_CARDS]

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="bg-brand relative overflow-hidden">
        {/* Diagonal decorative stripe */}
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-5 pointer-events-none"
             style={{ background: 'repeating-linear-gradient(-45deg, #CC0000, #CC0000 2px, transparent 2px, transparent 12px)' }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-28 relative">
          <div className="flex flex-col md:flex-row items-center gap-12">

            {/* Texto */}
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 px-3 py-1 rounded mb-5">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-primary text-xs font-bold uppercase tracking-widest">Estoque em tempo real</span>
              </div>
              <h1 className="font-display text-5xl sm:text-6xl md:text-7xl text-white uppercase leading-none mb-4">
                Galpão<br />
                <span className="text-primary">do Aço</span>
              </h1>
              <p className="text-gray-400 text-lg max-w-xl mx-auto md:mx-0 mb-3 leading-relaxed">
                A solução certa para sua obra!
              </p>
              <p className="text-gray-500 text-sm max-w-lg mx-auto md:mx-0 mb-8">
                Materiais de construção, ferragens e aços com estoque real e preços atualizados direto do nosso sistema.
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <Link href="/produtos" className="btn-primary text-base">
                  Ver Catálogo
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                  </svg>
                </Link>
                <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer"
                   className="btn-outline text-base">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Falar no WhatsApp
                </a>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 text-center">
              {[
                { label: 'Produtos',     value: total > 0 ? `${total.toLocaleString('pt-BR')}+` : '1.000+' },
                { label: 'Sempre',       value: 'Em Estoque' },
                { label: 'Atendimento',  value: 'Rápido'   },
                { label: 'Qualidade',    value: 'Garantida' },
              ].map(s => (
                <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-5 min-w-[130px]">
                  <div className="font-display text-2xl text-white leading-none">{s.value}</div>
                  <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom accent */}
        <div className="h-1 bg-primary w-full" />
      </section>

      {/* ── DIFERENCIAIS ─────────────────────────────────────────────── */}
      <section className="bg-white py-16 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <IconBox />,    title: 'Estoque Real',       desc: 'Dados atualizados direto do sistema de gestão ERP.' },
              { icon: <IconTag />,    title: 'Melhor Preço',       desc: 'Preços competitivos com atualização constante.' },
              { icon: <IconTruck />,  title: 'Pronta Entrega',     desc: 'Disponível para retirada ou entrega imediata.' },
              { icon: <IconShield />, title: 'Qualidade Garantida', desc: 'Trabalhamos apenas com produtos de qualidade.' },
            ].map(d => (
              <div key={d.title}
                   className="flex flex-col items-center text-center p-6 rounded-lg border border-gray-100 hover:border-primary/30 hover:bg-red-50 transition-all group">
                <div className="w-14 h-14 bg-primary rounded-lg flex items-center justify-center text-white mb-4
                                group-hover:scale-110 transition-transform">
                  {d.icon}
                </div>
                <h3 className="font-display text-lg uppercase text-gray-900 mb-2">{d.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUTOS EM DESTAQUE ──────────────────────────────────────── */}
      {destaques.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-end justify-between mb-8 gap-4">
              <div>
                {/* Red accent bar */}
                <div className="h-1 w-12 bg-primary rounded mb-3" />
                <h2 className="font-display text-3xl sm:text-4xl text-gray-900 uppercase">
                  Produtos em Destaque
                </h2>
                <p className="text-gray-500 mt-1 text-sm">
                  Seleção de produtos com estoque disponível.
                </p>
              </div>
              <Link href="/produtos" className="btn-outline text-sm py-2 whitespace-nowrap">
                Ver todos →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {destaques.map(p => <ProductCard key={p.id} produto={p} />)}
            </div>

            <div className="text-center mt-10">
              <Link href="/produtos" className="btn-primary text-base">
                Ver catálogo completo
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── INSTAGRAM / ANÚNCIOS ─────────────────────────────────────── */}
      <section className="py-14 bg-brand overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="h-1 w-12 bg-primary rounded mb-3" />
            <h2 className="font-display text-3xl sm:text-4xl text-white uppercase">
              Siga-nos no Instagram
            </h2>
            <p className="text-gray-400 text-sm mt-1">@galpaodoacorr — Ofertas e novidades da loja</p>
          </div>
          <a href="https://www.instagram.com/galpaodoacorr/"
             target="_blank"
             rel="noopener noreferrer"
             className="flex items-center gap-2 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500
                        text-white font-bold px-5 py-3 rounded-lg hover:opacity-90 transition-opacity text-sm whitespace-nowrap">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            Seguir @galpaodoacorr
          </a>
        </div>

        {/* Marquee */}
        <div className="marquee-wrapper">
          <div className="marquee-track gap-4 px-4">
            {doubled.map((card, i) => (
              <a key={i}
                 href="https://www.instagram.com/galpaodoacorr/"
                 target="_blank"
                 rel="noopener noreferrer"
                 className="flex-shrink-0 mx-2 hover:scale-105 transition-transform">
                <InstagramCard card={card} />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA WHATSAPP ─────────────────────────────────────────────── */}
      <section className="bg-green-600 text-white py-14" id="contato">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <svg className="w-12 h-12 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          <h2 className="font-display text-3xl sm:text-4xl text-white mb-3 uppercase">
            Ficou com dúvida? Fale conosco!
          </h2>
          <p className="text-green-100 mb-7 text-lg">
            Nossa equipe está pronta para atender você pelo WhatsApp.
          </p>
          <a
            href={`https://wa.me/${WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-white text-green-700 font-black px-8 py-4 rounded-xl
                       hover:bg-green-50 active:scale-95 transition-all shadow-lg text-lg uppercase tracking-wide"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Chamar no WhatsApp
          </a>
        </div>
      </section>
    </>
  )
}
