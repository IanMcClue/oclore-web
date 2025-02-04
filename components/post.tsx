import { ScratchPostPatterned } from './scratch-post-patterned'
import { MotivationPost } from './motivation-post'
import { AffirmationPost } from './affirmation-post'
import { CoachingPost } from './coaching-post'
import { Post as PostType } from '@/types/post'

interface PostProps {
  post: PostType
}

export function Post({ post }: PostProps) {
  switch (post.type) {
    case 'scratch':
      return <ScratchPostPatterned 
        content={post.content} 
        routine={post.routine || 'No routine available'} 
        pattern={post.pattern || 0}
      />
    case 'motivation':
      return <MotivationPost content={post.content} />
    case 'affirmation':
      return <AffirmationPost content={post.content} />
    case 'coaching':
      return <CoachingPost content={post.content} />
    default:
      return null
  }
}

