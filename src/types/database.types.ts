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
      spaces: {
        Row: {
          id: string
          created_at: string
          name: string
          description: string | null
          location: string | null
          category: string | null
          members_count: number
          rating: number | null
          creator_id: string
          is_private: boolean
          color: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description?: string | null
          location?: string | null
          category?: string | null
          members_count?: number
          rating?: number | null
          creator_id: string
          is_private?: boolean
          color?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string | null
          location?: string | null
          category?: string | null
          members_count?: number
          rating?: number | null
          creator_id?: string
          is_private?: boolean
          color?: string | null
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

