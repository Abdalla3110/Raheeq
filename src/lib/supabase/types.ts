/**
 * Proper TypeScript types for Supabase database
 * مولدة من الجداول في schema.sql
 */

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
      products: {
        Row: {
          id: string
          slug: string
          name: string
          description: string | null
          category: 'men' | 'women' | 'unisex'
          images: Json
          meta_title: string | null
          meta_description: string | null
          status: 'draft' | 'published' | 'archived'
          featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at'>
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          sku: string
          size_ml: number
          price: number
          stock: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['product_variants']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Omit<Database['public']['Tables']['product_variants']['Row'], 'id' | 'created_at'>
      }
      offers: {
        Row: {
          id: string
          variant_id: string
          discount_type: 'percentage' | 'fixed'
          discount_value: number
          start_at: string | null
          end_at: string | null
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['offers']['Row'], 'id' | 'created_at'>
        Update: Omit<Database['public']['Tables']['offers']['Row'], 'id' | 'created_at'>
      }
      reviews: {
        Row: {
          id: string
          product_id: string
          customer_name: string
          rating: number
          comment: string | null
          status: 'pending' | 'approved' | 'rejected'
          verified_purchase: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['reviews']['Row'], 'id' | 'created_at'>
        Update: Omit<Database['public']['Tables']['reviews']['Row'], 'id' | 'created_at'>
      }
      shipping_zones: {
        Row: {
          id: string
          governorate: string
          delivery_fee: number
          is_active: boolean
        }
        Insert: Omit<Database['public']['Tables']['shipping_zones']['Row'], 'id'>
        Update: Omit<Database['public']['Tables']['shipping_zones']['Row'], 'id'>
      }
      orders: {
        Row: {
          id: string
          order_number: number
          customer_name: string
          phone: string
          governorate: string
          city: string
          address: string
          notes: string | null
          subtotal: number
          discount_total: number
          shipping_fee: number
          total: number
          status: 'NEW' | 'CONFIRMED' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'order_number' | 'created_at' | 'updated_at'>
        Update: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'order_number' | 'created_at'>
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          variant_id: string | null
          product_name: string
          variant_size_ml: number
          variant_sku: string
          unit_price: number
          discount_amount: number
          final_price: number
          quantity: number
        }
        Insert: Omit<Database['public']['Tables']['order_items']['Row'], 'id'>
        Update: Omit<Database['public']['Tables']['order_items']['Row'], 'id'>
      }
      order_status_history: {
        Row: {
          id: string
          order_id: string
          status: string
          note: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['order_status_history']['Row'], 'id' | 'created_at'>
        Update: Omit<Database['public']['Tables']['order_status_history']['Row'], 'id' | 'created_at'>
      }
      admin_users: {
        Row: {
          id: string
          role: 'admin'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['admin_users']['Row'], 'id' | 'created_at'>
        Update: Omit<Database['public']['Tables']['admin_users']['Row'], 'id' | 'created_at'>
      }
      rate_limits: {
        Row: {
          id: string
          identifier: string
          action_type: string
          count: number
          expires_at: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['rate_limits']['Row'], 'id' | 'created_at'>
        Update: Omit<Database['public']['Tables']['rate_limits']['Row'], 'id' | 'created_at'>
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