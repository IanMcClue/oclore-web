export type PostType = 'scratch' | 'motivation' | 'affirmation' | 'coaching';

export interface Post {
  id: string;
  type: PostType;
  content: string;
  revealed?: boolean;
  routine?: string;
  pattern?: number;
}

