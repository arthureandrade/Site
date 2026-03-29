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
    <section className="relative overflow-hidden border-b border-gray-200 bg-[#111]">
      <div className="absolute inset-0">
        {slides.map((image, index) => (
          <div
            key={`${image}-${index}`}
            className="absolute inset-0 transition-opacity duration-700"
            style={{
              opacity: index === activeIndex ? 1 : 0,
              backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.72) 38%, rgba(0,0,0,0.28) 72%, rgba(0,0,0,0.12) 100%), url('${image}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
        <div className="relative z-10">
          <span className="inline-flex rounded-full bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-white">
            Home comercial
          </span>
          <h1 className="mt-6 max-w-3xl text-4xl font-black uppercase leading-[0.96] text-white sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-gray-200">
            {subtitle}
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
  )
}
