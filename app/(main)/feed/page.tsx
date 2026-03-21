import { createClient } from '@/lib/supabase/server'
import StoriesBar from '@/components/stories/StoriesBar'
import PostFeed from '@/components/posts/PostFeed'
import SuggestedUsers from '@/components/profile/SuggestedUsers'

export default async function FeedPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get following list
  const { data: following } = await supabase
    .from('followers')
    .select('following_id')
    .eq('follower_id', user!.id)

  const followingIds = following?.map(f => f.following_id) || []
  const feedUserIds = [...followingIds, user!.id]

  // Fetch posts from followed users + own posts
  const { data: posts } = await supabase
    .from('posts')
    .select(`
      *,
      user:users(*)
    `)
    .in('user_id', feedUserIds)
    .order('created_at', { ascending: false })
    .limit(20)

  // Check which posts are liked by current user
  const postIds = posts?.map(p => p.id) || []
  const { data: userLikes } = await supabase
    .from('likes')
    .select('post_id')
    .eq('user_id', user!.id)
    .in('post_id', postIds)

  const likedPostIds = new Set(userLikes?.map(l => l.post_id) || [])
  const postsWithLikes = posts?.map(post => ({
    ...post,
    liked_by_user: likedPostIds.has(post.id),
  })) || []

  // Fetch stories (not expired, from following + self)
  const { data: stories } = await supabase
    .from('stories')
    .select(`*, user:users(*)`)
    .in('user_id', feedUserIds)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  // Check which stories viewed
  const storyIds = stories?.map(s => s.id) || []
  const { data: viewedStories } = await supabase
    .from('story_views')
    .select('story_id')
    .eq('viewer_id', user!.id)
    .in('story_id', storyIds)

  const viewedStoryIds = new Set(viewedStories?.map(v => v.story_id) || [])

  // Group stories by user
  const storyGroups: Record<string, { user: any; stories: any[]; hasUnviewed: boolean }> = {}
  stories?.forEach(story => {
    if (!storyGroups[story.user_id]) {
      storyGroups[story.user_id] = {
        user: story.user,
        stories: [],
        hasUnviewed: false,
      }
    }
    storyGroups[story.user_id].stories.push(story)
    if (!viewedStoryIds.has(story.id)) {
      storyGroups[story.user_id].hasUnviewed = true
    }
  })

  const storyGroupsArray = Object.values(storyGroups)

  // Suggested users (not following)
  const { data: currentUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', user!.id)
    .single()

  const { data: suggested } = await supabase
    .from('users')
    .select('*')
    .not('id', 'in', `(${feedUserIds.join(',')})`)
    .limit(5)

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6">
      <div className="flex gap-8">
        {/* Feed */}
        <div className="flex-1 max-w-xl mx-auto xl:mx-0">
          {storyGroupsArray.length > 0 && (
            <StoriesBar storyGroups={storyGroupsArray} currentUserId={user!.id} />
          )}
          <PostFeed
            initialPosts={postsWithLikes}
            currentUserId={user!.id}
          />
        </div>

        {/* Sidebar - Suggestions */}
        <aside className="hidden xl:block w-80 flex-shrink-0">
          {currentUser && (
            <SuggestedUsers
              currentUser={currentUser}
              suggestedUsers={suggested || []}
              currentUserId={user!.id}
            />
          )}
        </aside>
      </div>
    </div>
  )
}
