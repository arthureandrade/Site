import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CartIcon from '@/components/CartIcon'
import { CartProvider } from '@/context/CartContext'

export const metadata = {
  title: {
    default: 'Galpão do Aço — Material de Construção',
    template: '%s | Galpão do Aço',
  },
  description:
    'Sua loja de material de construção com os melhores preços. Cimento, ferro, aço e muito mais.',
  keywords: ['material de construção', 'cimento', 'ferro', 'aço', 'galpão do aço'],
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen flex flex-col">
        <CartProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartIcon />
        </CartProvider>
      </body>
    </html>
  )
}
