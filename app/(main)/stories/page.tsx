import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import UserAvatar from '@/components/ui/UserAvatar'
import { formatTimeAgo } from '@/lib/utils'
import CreateStoryButton from '@/components/stories/CreateStoryButton'

export default async function ИсторииPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: following } = await supabase
    .from('followers')
    .select('following_id')
    .eq('follower_id', user.id)

  const followingIds = following?.map(f => f.following_id) || []
  const feedUserIds = [...followingIds, user.id]

  const { data: stories } = await supabase
    .from('истории')
    .select('*, user:users(*)')
    .in('user_id', feedUserIds)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  // Group by user
  const groups: Record<string, { user: any; stories: any[]; latest: string }> = {}
  stories?.forEach(story => {
    if (!groups[story.user_id]) {
      groups[story.user_id] = { user: story.user, stories: [], latest: story.created_at }
    }
    groups[story.user_id].stories.push(story)
  })

  const groupsArr = Object.values(groups)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Истории</h1>
        <CreateStoryButton currentUserId={user.id} />
      </div>

      {groupsArr.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <div className="text-5xl mb-4">📖</div>
          <p className="font-semibold mb-1">Историй пока нет</p>
          <p className="text-sm">Подпишитесь на людей чтобы видеть их истории</p>
        </div>
      ) : (
        <div className="space-y-2">
          {groupsArr.map(group => (
            <Link
              key={group.user.id}
              href={`/stories/${group.user.id}`}
              className="flex items-center gap-4 p-4 glass rounded-2xl hover:bg-white/5 transition-colors"
            >
              <UserAvatar
                user={group.user}
                size="lg"
                hasStory={true}
                storyViewed={false}
              />
              <div className="flex-1">
                <p className="font-semibold">{group.user.username}</p>
                <p className="text-sm text-muted-foreground">
                  {group.stories.length} {group.stories.length === 1 ? 'история' : 'истории'} · {formatTimeAgo(group.latest)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
