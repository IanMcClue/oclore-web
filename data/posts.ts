import { Post } from '@/types/post'

const basePostTemplates: Post[] = [
  {
    id: '1',
    type: 'scratch',
    content: ' I Deserve it all. The Career. The Love. The Family. The Peace. The life.',
    routine: 'Claim ✨',
    pattern: 4
  },
  {
    id: '2',
    type: 'motivation',
    content: 'Every day is a new opportunity to become the person you want to be.',
    routine: 'morning',
    pattern: 0
  },
  {
    id: '3',
    type: 'affirmation',
    content: 'I am capable of achieving anything I set my mind to.',
    routine: 'evening',
    pattern: 1
  },
  {
    id: '4',
    type: 'coaching',
    content: 'Break down your big goals into small, manageable steps.',
    routine: 'morning',
    pattern: 0
  },
  {
    id: '5',
    type: 'scratch',
    content: 'Your Friendly Reminder That If You Need to Start Over You Can Without no Ones Permission',
    routine: 'Claim ✨',
    pattern: 4
  },
  {
    id: '6',
    type: 'scratch',
    content: 'What You\'re Not Changing Your Choosing',
    routine: 'Truth❗',
    pattern: 4
  },
  {
    id: '7',
    type: 'scratch',
    content: 'Nothing Changes If Nothing Changes',
    routine: 'Truth❗',
    pattern: 4
  },
  {
    id: '8',
    type: 'scratch',
    content: 'Don\'t treat life like a to do list. Treat it like a to be menu. You have choices. Its your job to pick the best options for the life you want.',
    routine: 'Claim ✨',
    pattern: 4
  } 
]

// Generate more posts while maintaining type safety
export const posts: Post[] = Array(20).fill(null).map((_, index) => {
  const template = basePostTemplates[index % basePostTemplates.length]
  return {
    ...template,
    id: `${index + 1}`, // Ensure unique IDs
  }
})

