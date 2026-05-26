import './globals.css'
import { Suspense } from 'react'
import AnalyticsRouteTracker from '@/components/AnalyticsRouteTracker'
import AnalyticsScripts from '@/components/AnalyticsScripts'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CartIcon from '@/components/CartIcon'
import WhatsAppFloat from '@/components/WhatsAppFloat'
import { CartProvider } from '@/context/CartContext'
import { buildLocalBusinessJsonLd } from '@/lib/seo'

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.galpaodoaco.com'),
  title: {
    default: 'Galpão do Aço | Material de Construção',
    template: '%s | Galpão do Aço',
  },
  description:
    'Sua loja de material de construção com os melhores preços. Cimento, ferro, aço e muito mais.',
  keywords: ['material de construção', 'cimento', 'ferro', 'aço', 'galpão do aço'],
  icons: {
    icon: '/logo.jpeg',
    shortcut: '/logo.jpeg',
    apple: '/logo.jpeg',
  },
}

export default function RootLayout({ children }) {
  const localBusinessJsonLd = buildLocalBusinessJsonLd()

  return (
    <html lang="pt-BR">
      <body className="min-h-screen flex flex-col">
        <AnalyticsScripts />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
        <CartProvider>
          <Suspense fallback={null}>
            <AnalyticsRouteTracker />
          </Suspense>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <WhatsAppFloat />
          <CartIcon />
        </CartProvider>
      </body>
    </html>
  )
}
