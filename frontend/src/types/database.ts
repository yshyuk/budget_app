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
      transactions: {
        Row: {
          id: string
          user_id: string
          type: 'income' | 'expense' | 'saving'
          category: string
          amount: number
          transaction_date: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'income' | 'expense' | 'saving'
          category: string
          amount: number
          transaction_date?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'income' | 'expense' | 'saving'
          category?: string
          amount?: number
          transaction_date?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          year: number
          month: number
          income_budget: number
          expense_budget: number
          saving_budget: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          year: number
          month: number
          income_budget?: number
          expense_budget?: number
          saving_budget?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          year?: number
          month?: number
          income_budget?: number
          expense_budget?: number
          saving_budget?: number
          created_at?: string
          updated_at?: string
        }
      }
      wishlist_items: {
        Row: {
          id: string
          user_id: string
          item_name: string
          price: number
          priority: number
          saved_amount: number
          is_purchased: boolean
          target_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          item_name: string
          price: number
          priority?: number
          saved_amount?: number
          is_purchased?: boolean
          target_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          item_name?: string
          price?: number
          priority?: number
          saved_amount?: number
          is_purchased?: boolean
          target_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
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

// Helper types for easier use
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
export type TransactionUpdate = Database['public']['Tables']['transactions']['Update']

export type Budget = Database['public']['Tables']['budgets']['Row']
export type BudgetInsert = Database['public']['Tables']['budgets']['Insert']
export type BudgetUpdate = Database['public']['Tables']['budgets']['Update']

export type WishlistItem = Database['public']['Tables']['wishlist_items']['Row']
export type WishlistItemInsert = Database['public']['Tables']['wishlist_items']['Insert']
export type WishlistItemUpdate = Database['public']['Tables']['wishlist_items']['Update']

export type TransactionType = 'income' | 'expense' | 'saving'
