import Link from 'next/link'

export default function Footer() {
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP || '5500000000000'

  return (
    <footer className="bg-brand text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Marca */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center font-black text-white text-lg">G</div>
              <span className="text-white font-bold text-lg">Galpão do Aço</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-500 max-w-xs">
              Sua loja completa de material de construção. Qualidade, variedade e os melhores preços da região.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Navegação</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/"         className="hover:text-white transition-colors">Início</Link></li>
              <li><Link href="/produtos" className="hover:text-white transition-colors">Produtos</Link></li>
              <li><Link href="#contato"  className="hover:text-white transition-colors">Contato</Link></li>
            </ul>
          </div>

          {/* Contato */}
          <div id="contato">
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Contato</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-white transition-colors"
                >
                  {/* WhatsApp icon */}
                  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 text-xs text-center text-gray-600">
          © {new Date().getFullYear()} Galpão do Aço. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  )
}
