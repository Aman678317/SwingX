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
      profiles: {
        Row: {
          id: string
          full_name: string | null
          email: string | null
          role: 'subscriber' | 'admin'
          subscription_status: 'active' | 'inactive' | 'cancelled' | 'lapsed'
          subscription_plan: 'monthly' | 'yearly' | null
          subscription_renewal_date: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          charity_id: string | null
          charity_contribution_percent: number
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          email?: string | null
          role?: 'subscriber' | 'admin'
          subscription_status?: 'active' | 'inactive' | 'cancelled' | 'lapsed'
          subscription_plan?: 'monthly' | 'yearly' | null
          subscription_renewal_date?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          charity_id?: string | null
          charity_contribution_percent?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      scores: {
        Row: {
          id: string
          user_id: string
          score: number
          score_date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          score: number
          score_date: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['scores']['Insert']>
      }
      charities: {
        Row: {
          id: string
          name: string
          description: string | null
          image_url: string | null
          is_featured: boolean
          upcoming_events: Json | null
          website_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          image_url?: string | null
          is_featured?: boolean
          upcoming_events?: Json | null
          website_url?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['charities']['Insert']>
      }
      draws: {
        Row: {
          id: string
          draw_month: string
          status: 'pending' | 'simulated' | 'published'
          draw_type: 'random' | 'algorithmic'
          drawn_numbers: number[] | null
          jackpot_amount: number | null
          four_match_amount: number | null
          three_match_amount: number | null
          jackpot_rolled_over: boolean
          created_at: string
        }
        Insert: {
          id?: string
          draw_month: string
          status?: 'pending' | 'simulated' | 'published'
          draw_type?: 'random' | 'algorithmic'
          drawn_numbers?: number[] | null
          jackpot_amount?: number | null
          four_match_amount?: number | null
          three_match_amount?: number | null
          jackpot_rolled_over?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['draws']['Insert']>
      }
      draw_entries: {
        Row: {
          id: string
          draw_id: string
          user_id: string
          score_snapshot: number[]
          match_count: number
          is_winner: boolean
          prize_tier: '5-match' | '4-match' | '3-match' | null
          prize_amount: number | null
          created_at: string
        }
        Insert: {
          id?: string
          draw_id: string
          user_id: string
          score_snapshot: number[]
          match_count?: number
          is_winner?: boolean
          prize_tier?: '5-match' | '4-match' | '3-match' | null
          prize_amount?: number | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['draw_entries']['Insert']>
      }
      winner_verifications: {
        Row: {
          id: string
          draw_entry_id: string
          user_id: string
          proof_url: string | null
          status: 'pending' | 'approved' | 'rejected'
          payout_status: 'pending' | 'paid'
          admin_notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          draw_entry_id: string
          user_id: string
          proof_url?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          payout_status?: 'pending' | 'paid'
          admin_notes?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['winner_verifications']['Insert']>
      }
    }
  }
}
