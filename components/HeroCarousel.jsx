'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP || '559532240115'

export default function HeroCarousel({ images = [], title, subtitle }) {
  const slides = (images || []).filter(Boolean)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (slides.length <= 1) return undefined
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length)
    }, 3000)
    return () => window.clearInterval(timer)
  }, [slides.length])

  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-[#111]">
      <div className="absolute inset-0">
        {slides.map((image, index) => (
          <div
            key={`${image}-${index}`}
            className="absolute inset-0 transition-opacity duration-700"
            style={{
              opacity: index === activeIndex ? 1 : 0,
              backgroundImage: `linear-gradient(90deg, rgba(5,10,20,0.94) 0%, rgba(9,18,36,0.84) 34%, rgba(9,18,36,0.48) 70%, rgba(9,18,36,0.16) 100%), url('${image}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.22),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_25%)]" />

      <div className="relative mx-auto grid max-w-[1600px] gap-6 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10 lg:px-8 lg:py-20">
        <div className="relative z-10">
          <span className="trust-chip">Operacao comercial com estoque real</span>
          <h1 className="mt-4 max-w-3xl text-[2rem] font-black uppercase leading-[0.98] text-white sm:mt-6 sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-gray-200 sm:mt-5 sm:text-lg">
            {subtitle}
          </p>
          <div className="mt-5 flex flex-wrap gap-2 sm:mt-6 sm:gap-3">
            <span className="trust-chip">Compra online</span>
            <span className="trust-chip">Retirada rapida</span>
            <span className="trust-chip">Atendimento no WhatsApp</span>
          </div>
          <div className="mt-6 grid gap-3 sm:mt-8 sm:flex sm:flex-wrap">
            <Link
              href="/produtos"
              className="rounded-[18px] bg-primary px-5 py-3 text-center text-xs font-black uppercase tracking-[0.16em] text-white shadow-[0_18px_32px_rgba(185,28,28,0.3)] transition hover:bg-red-700 sm:rounded-[22px] sm:px-7 sm:py-4 sm:text-sm sm:tracking-[0.18em]"
            >
              Comprar agora
            </Link>
            <a
              href={`https://wa.me/${WHATSAPP}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-[18px] border border-white/20 bg-black/35 px-5 py-3 text-center text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/10 sm:rounded-[22px] sm:px-7 sm:py-4 sm:text-sm sm:tracking-[0.18em]"
            >
              Falar no WhatsApp
            </a>
          </div>

          {slides.length > 1 && (
            <div className="mt-6 flex items-center gap-2 sm:mt-8">
              {slides.map((_, index) => (
                <button
                  key={`dot-${index}`}
                  type="button"
                  aria-label={`Ir para slide ${index + 1}`}
                  onClick={() => setActiveIndex(index)}
                  className={`h-2.5 rounded-full transition-all ${index === activeIndex ? 'w-10 bg-primary' : 'w-2.5 bg-white/45'}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 lg:mx-0 lg:grid lg:grid-cols-2 lg:overflow-visible lg:px-0 lg:pb-0">
          {[
            { titulo: '+ clientes atendidos', valor: 'Milhares', detalhe: 'Atuacao forte em obra, serralheria e manutencao' },
            { titulo: 'Grande estoque', valor: 'Sempre ativo', detalhe: 'Mix amplo para compra rapida e recorrente' },
            { titulo: 'Parcelamento', valor: '10x sem juros', detalhe: 'Condicao clara para acelerar conversao' },
            { titulo: 'Atendimento', valor: 'Resposta rapida', detalhe: 'Equipe comercial pronta no WhatsApp' },
          ].map((item) => (
            <div
              key={item.titulo}
              className="min-w-[240px] rounded-[24px] border border-white/10 bg-white/10 p-4 shadow-[0_18px_34px_rgba(15,23,42,0.18)] backdrop-blur-sm sm:min-w-[260px] sm:p-5 lg:min-w-0 lg:rounded-[28px]"
            >
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-gray-300">{item.titulo}</div>
              <div className="mt-3 text-2xl font-black uppercase leading-none text-white sm:text-3xl">{item.valor}</div>
              <div className="mt-3 text-sm leading-relaxed text-gray-300">{item.detalhe}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
