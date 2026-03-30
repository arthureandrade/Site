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
              backgroundImage: `linear-gradient(90deg, rgba(5,10,20,0.92) 0%, rgba(9,18,36,0.82) 32%, rgba(9,18,36,0.42) 68%, rgba(9,18,36,0.18) 100%), url('${image}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.22),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_25%)]" />

      <div className="relative mx-auto grid max-w-[1600px] gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:py-20 lg:px-8">
        <div className="relative z-10">
          <span className="trust-chip">
            Operacao comercial com estoque real
          </span>
          <h1 className="mt-6 max-w-3xl text-4xl font-black uppercase leading-[0.96] text-white sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-gray-200">
            {subtitle}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="trust-chip">Compra online</span>
            <span className="trust-chip">Retirada rapida</span>
            <span className="trust-chip">Atendimento no WhatsApp</span>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/produtos" className="rounded-[22px] bg-primary px-7 py-4 text-sm font-black uppercase tracking-[0.18em] text-white shadow-[0_18px_32px_rgba(185,28,28,0.3)] transition hover:bg-red-700">
              Comprar agora
            </Link>
            <a
              href={`https://wa.me/${WHATSAPP}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-[22px] border border-white/20 bg-black/35 px-7 py-4 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-white/10"
            >
              Falar no WhatsApp
            </a>
          </div>

          {slides.length > 1 && (
            <div className="mt-8 flex items-center gap-2">
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

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { titulo: '+ clientes atendidos', valor: 'Milhares', detalhe: 'Atuacao forte em obra, serralheria e manutencao' },
            { titulo: 'Grande estoque', valor: 'Sempre ativo', detalhe: 'Mix amplo para compra rapida e recorrente' },
            { titulo: 'Parcelamento', valor: '10x sem juros', detalhe: 'Condição clara para acelerar conversao' },
            { titulo: 'Atendimento', valor: 'Resposta rapida', detalhe: 'Equipe comercial pronta no WhatsApp' },
          ].map((item) => (
            <div key={item.titulo} className="rounded-[28px] border border-white/10 bg-white/10 p-5 shadow-[0_18px_34px_rgba(15,23,42,0.18)] backdrop-blur-sm">
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-gray-300">{item.titulo}</div>
              <div className="mt-3 text-3xl font-black uppercase leading-none text-white">{item.valor}</div>
              <div className="mt-3 text-sm leading-relaxed text-gray-300">{item.detalhe}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
