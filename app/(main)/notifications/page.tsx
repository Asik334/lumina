import dynamic from 'next/dynamic'

const NotificationsClient = dynamic(
  () => import('@/components/notifications/NotificationsClient'),
  { ssr: false }
)

export default function NotificationsPage() {
  return <NotificationsClient />
}
