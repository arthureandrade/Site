import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CartIcon from '@/components/CartIcon'
import WhatsAppFloat from '@/components/WhatsAppFloat'
import { CartProvider } from '@/context/CartContext'
import Script from 'next/script'

export const metadata = {
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
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

  return (
    <html lang="pt-BR">
      <body className="min-h-screen flex flex-col">
        {gaId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        ) : null}
        <CartProvider>
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
