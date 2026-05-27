'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import TrackedWhatsAppLink from '@/components/TrackedWhatsAppLink'

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP || '559532240115'

export default function HeroCarousel({ images = [], title, subtitle }) {
  const slides = (images || []).filter(Boolean)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (slides.length <= 1) return undefined
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length)
    }, 4500)
    return () => window.clearInterval(timer)
  }, [slides.length])

  if (!slides.length) {
    return (
      <section className="border-b border-slate-200 bg-white py-8 md:bg-white/85 md:backdrop-blur-sm">
        <div className="mx-auto max-w-[1760px] px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-3xl uppercase text-slate-950 sm:text-5xl">{title}</h1>
          <p className="mt-3 max-w-3xl text-slate-600">{subtitle}</p>
        </div>
      </section>
    )
  }

  return (
    <section className="border-b border-slate-200 bg-white md:bg-white/85 md:backdrop-blur-sm">
      <h1 className="sr-only">{title}</h1>
      {subtitle && <p className="sr-only">{subtitle}</p>}

      <div className="mx-auto max-w-[1760px] px-3 py-3 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[18px] border border-slate-200 bg-slate-100 shadow-[0_12px_32px_rgba(15,23,42,0.08)] sm:mt-4 sm:rounded-[28px] sm:shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
          <div className="relative aspect-[2048/768] w-full">
            {slides.map((image, index) => (
              <img
                key={`${image}-${index}`}
                src={image}
                alt={index === 0 ? title || 'Galpão do Aço' : `Hero Galpão do Aço ${index + 1}`}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                  index === activeIndex ? 'opacity-100' : 'opacity-0'
                }`}
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
              />
            ))}
          </div>
        </div>

        {slides.length > 1 && (
          <div className="mt-3 flex justify-center gap-2">
            {slides.map((_, index) => (
              <button
                key={`hero-dot-${index}`}
                type="button"
                aria-label={`Ir para imagem ${index + 1}`}
                onClick={() => setActiveIndex(index)}
                className={`h-2.5 rounded-full transition-all ${
                  index === activeIndex ? 'w-10 bg-primary' : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
        )}

        <div className="mt-3 rounded-[18px] border border-slate-200 bg-white p-3 shadow-[0_10px_28px_rgba(15,23,42,0.08)] sm:mt-4 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:rounded-[22px] sm:border-white/70 sm:bg-white/[0.92] sm:p-4 sm:backdrop-blur">
          <div className="text-center sm:text-left">
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">
              Galpão do Aço
            </div>
            <div className="mt-1 text-sm font-bold text-slate-700">
              Estoque real, preço atualizado e atendimento rápido no WhatsApp.
            </div>
          </div>

          <div className="mt-3 grid gap-2 sm:mt-0 sm:flex sm:shrink-0">
            <Link
              href="/produtos"
              className="rounded-2xl bg-primary px-5 py-3 text-center text-xs font-black uppercase tracking-[0.16em] text-white shadow-[0_14px_28px_rgba(185,28,28,0.22)] transition hover:bg-red-700"
            >
              Ver catálogo
            </Link>
            <TrackedWhatsAppLink
              href={`https://wa.me/${WHATSAPP}`}
              target="_blank"
              rel="noopener noreferrer"
              label="hero_whatsapp"
              className="rounded-2xl border border-green-500 bg-green-500 px-5 py-3 text-center text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-green-600"
            >
              Falar no WhatsApp
            </TrackedWhatsAppLink>
          </div>
        </div>
      </div>
    </section>
  )
}
