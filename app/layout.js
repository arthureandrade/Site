import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CartIcon from '@/components/CartIcon'
import WhatsAppFloat from '@/components/WhatsAppFloat'
import { CartProvider } from '@/context/CartContext'

export const metadata = {
  title: {
    default: 'Galpao do Aco | Material de Construcao',
    template: '%s | Galpao do Aco',
  },
  description:
    'Sua loja de material de construcao com os melhores precos. Cimento, ferro, aco e muito mais.',
  keywords: ['material de construcao', 'cimento', 'ferro', 'aco', 'galpao do aco'],
  icons: {
    icon: '/logo.jpeg',
    shortcut: '/logo.jpeg',
    apple: '/logo.jpeg',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen flex flex-col">
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
