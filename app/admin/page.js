import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminHomeManager from '@/components/AdminHomeManager'

export const metadata = {
  title: 'Admin | Galpao do Aco',
}

export default function AdminPage() {
  const cookieStore = cookies()
  const auth = cookieStore.get('admin_auth')?.value

  if (!auth) {
    redirect('/acesso')
  }

  return <AdminHomeManager />
}
