import { notFound } from 'next/navigation'
import { requireAdmin } from '../../lib/supabase/auth-guard'
import AdminDashboardClient from './AdminDashboardClient'

export default async function AdminPage() {
  // Server-side role check: throws AuthError or returns auth
  try {
    const auth = await requireAdmin()
    if (auth.profile.role !== 'admin') {
      notFound()
    }
  } catch {
    // Non-admins and unauthenticated users receive a strict 404 Not Found response
    notFound()
  }

  return <AdminDashboardClient />
}
