import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ProfileHeader from '@/components/profile/ProfileHeader'
import ProfileGrid from '@/components/profile/ProfileGrid'

interface ProfilePageProps {
  params: { username: string }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const supabase = createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('username', params.username)
    .single()

  if (!profile) notFound()

  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  const isOwnProfile = authUser?.id === profile.id

  // Check if current user is following this profile
  let isFollowing = false
  if (authUser && !isOwnProfile) {
    const { data: followData } = await supabase
      .from('followers')
      .select('id')
      .eq('follower_id', authUser.id)
      .eq('following_id', profile.id)
      .single()
    isFollowing = !!followData
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <ProfileHeader
        profile={profile}
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowing}
        currentUserId={authUser?.id || ''}
        postsCount={posts?.length || 0}
      />
      <ProfileGrid posts={posts || []} />
    </div>
  )
}
