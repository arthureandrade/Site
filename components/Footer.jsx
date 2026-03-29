import Link from 'next/link'

export default function Footer() {
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP || '559532240115'
  const telefone = '(95) 3224-0115'

  return (
    <footer className="mt-auto border-t-2 border-primary bg-brand text-gray-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="mb-3 flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-primary font-display text-xl leading-none text-white">G</div>
              <div>
                <div className="font-display text-lg uppercase tracking-wide text-white">Galpao do Aco</div>
                <div className="text-[10px] uppercase tracking-widest text-gray-500">Material de construcao</div>
              </div>
            </div>

            <p className="mb-4 max-w-xs text-sm leading-relaxed text-gray-500">
              A solucao certa para sua obra em Boa Vista, com estoque real, atendimento rapido e venda no WhatsApp.
            </p>

            <div className="mb-5 space-y-2 text-sm">
              <a href="tel:9532240115" className="block font-bold text-white transition-colors hover:text-primary">
                Telefone: {telefone}
              </a>
              <p>Av. Ataide Teive, 5928</p>
              <p>Av. Ataide Teive, 4509</p>
            </div>

            <a
              href="https://www.instagram.com/galpaodoacorr/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              @galpaodoacorr
            </a>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-white">Navegacao</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="transition-colors hover:text-white">Inicio</Link></li>
              <li><Link href="/produtos" className="transition-colors hover:text-white">Produtos</Link></li>
              <li><Link href="/produtos?categoria=ferro_aco" className="transition-colors hover:text-white">Ferro e Aco</Link></li>
              <li><Link href="/vendedor" className="transition-colors hover:text-white">Area do vendedor</Link></li>
            </ul>
          </div>

          <div id="contato">
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-white">Contato</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="tel:9532240115" className="flex items-center gap-2 transition-colors hover:text-white">
                  <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h2l3.6 7.59a1 1 0 00.9.57h6.72a1 1 0 00.95-.68L21 6H7" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 16a2 2 0 11-.001 3.999A2 2 0 0116 16zM10 16a2 2 0 11-.001 3.999A2 2 0 0110 16z" />
                  </svg>
                  {telefone}
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 transition-colors hover:text-white"
                >
                  <svg className="h-4 w-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  WhatsApp
                </a>
              </li>
              <li>
                <span className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Av. Ataide Teive, 5928
                </span>
              </li>
              <li>
                <span className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Av. Ataide Teive, 4509
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-800 pt-6 text-center text-xs text-gray-600">
          © {new Date().getFullYear()} Galpao do Aco. Todos os direitos reservados. Boa Vista/RR
        </div>
      </div>
    </footer>
  )
}
