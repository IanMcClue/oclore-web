export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          user_id: string
          name: string
          email: string
          created_at?: string
        }
        Insert: {
          user_id: string
          name: string
          email: string
          created_at?: string
        }
        Update: {
          user_id?: string
          name?: string
          email?: string
          created_at?: string
        }
      }
      user_stories: {
        Row: {
          user_id: string
          story: string
          routines?: string
          created_at?: string
        }
        Insert: {
          user_id: string
          story: string
          routines?: string
          created_at?: string
        }
        Update: {
          user_id?: string
          story?: string
          routines?: string
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          user_id: string
          status: string
          stripe_subscription_id?: string
          plan_type?: string
          created_at?: string
        }
        Insert: {
          user_id: string
          status: string
          stripe_subscription_id?: string
          plan_type?: string
          created_at?: string
        }
        Update: {
          user_id?: string
          status?: string
          stripe_subscription_id?: string
          plan_type?: string
          created_at?: string
        }
      }
      user_responses: {
        Row: {
          id: string
          user_id: string
          name: string
          responses: Json
          status: 'pending' | 'verified' | 'story-generated'
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          name: string
          responses: Json
          status?: 'pending' | 'verified' | 'story-generated'
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          responses?: Json
          status?: 'pending' | 'verified' | 'story-generated'
          updated_at?: string
        }
      }
      // Add the missing user_routines table
      user_routines: {
        Row: {
          id: string
          user_id: string
          routine_name: string
          frequency: string
          time_of_day: string
          created_at?: string
        }
        Insert: {
          id?: string
          user_id: string
          routine_name: string
          frequency: string
          time_of_day: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          routine_name?: string
          frequency?: string
          time_of_day?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
