import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-20">
      <div className="text-8xl font-extrabold text-gray-100 mb-4">404</div>
      <h2 className="text-2xl font-bold text-gray-800 mb-3">Página não encontrada</h2>
      <p className="text-gray-500 mb-8 max-w-sm">
        O produto ou página que você procura não existe ou foi removido.
      </p>
      <div className="flex gap-3">
        <Link href="/"         className="btn-primary">Ir para o início</Link>
        <Link href="/produtos" className="btn-outline">Ver produtos</Link>
      </div>
    </div>
  )
}
