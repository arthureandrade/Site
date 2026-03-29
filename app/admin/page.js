'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminHomeManager from '@/components/AdminHomeManager'
import { ADMIN_PASSWORD, lerAdminCookie } from '@/lib/adminAuth'

export default function AdminPage() {
  const router = useRouter()
  const [autorizado, setAutorizado] = useState(false)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const senhaSessao = typeof window !== 'undefined' ? window.sessionStorage.getItem('admin_password') || '' : ''
    const senhaCookie = lerAdminCookie()
    const auth = senhaSessao || senhaCookie

    if (auth === ADMIN_PASSWORD) {
      setAutorizado(true)
      setCarregando(false)
      return
    }

    router.replace('/acesso')
  }, [router])

  if (carregando) {
    return <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">Validando acesso...</div>
  }

  if (!autorizado) {
    return null
  }

  return <AdminHomeManager />
}
