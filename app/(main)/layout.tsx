import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import MobileNav from '@/components/layout/MobileNav'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <Sidebar user={profile} isAdmin={profile?.is_admin} />

      {/* Main Content */}
      <main className="flex-1 ml-0 md:ml-64 xl:ml-72 pb-24 md:pb-0 min-h-screen overflow-x-hidden">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav user={profile} />
    </div>
  )
}
