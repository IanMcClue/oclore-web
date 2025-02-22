import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import FutureStoryClient from './client'

export default async function FutureStory() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth?redirectTo=/future-story')
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth?redirectTo=/future-story')
  }

  const name = user.user_metadata.display_name || user.user_metadata.full_name || ''

  try {
    // Get both story and responses status
    const [storyResult, responsesResult] = await Promise.all([
      supabase
        .from('user_stories')
        .select('story, updated_at')
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('user_responses')
        .select('status, updated_at')
        .eq('user_id', user.id)
        .single()
    ])


    // Determine loading state
    const isGenerating = responsesResult.data?.status === 'verified'

    return (
      <FutureStoryClient 
        user={user} 
        name={name} 
        initialStory={storyResult.data?.story || ''} 
        status={responsesResult.data?.status || 'pending'}
        isGenerating={isGenerating}
        lastUpdated={storyResult.data?.updated_at || null}
      />
    )
  } catch (error) {
    console.error('Error in future story page:', error)
    return (
      <FutureStoryClient 
        user={user} 
        name={name} 
        initialStory="" 
        status="error"
        isGenerating={false}
        lastUpdated={null}
      />
    )
  }
}

