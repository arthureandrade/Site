'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ADMIN_PASSWORD } from '@/lib/adminAuth'

export default function AcessoPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setErro('')

    if (password.trim() !== ADMIN_PASSWORD) {
      setErro('Senha incorreta.')
      setLoading(false)
      return
    }

    window.sessionStorage.setItem('admin_password', ADMIN_PASSWORD)
    document.cookie = `admin_auth=${encodeURIComponent(ADMIN_PASSWORD)}; path=/; SameSite=Lax`
    router.push('/admin')
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md rounded-[2rem] border border-gray-200 bg-white p-8 shadow-xl">
        <div className="text-[11px] font-black uppercase tracking-[0.28em] text-primary">Area administrativa</div>
        <h1 className="mt-3 text-3xl font-black uppercase text-gray-900">Entrar</h1>
        <p className="mt-2 text-sm text-gray-500">Use a senha da administracao para editar a homepage.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Digite a senha"
            className="input"
          />

          {erro && <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-primary">{erro}</div>}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-2xl bg-primary px-5 py-4 text-sm font-black uppercase tracking-wide text-white disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Acessar painel'}
          </button>
        </form>
      </div>
    </div>
  )
}
