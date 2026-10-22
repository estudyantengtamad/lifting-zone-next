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
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'customer' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'customer' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'customer' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      admin_emails: {
        Row: {
          email: string
          note: string | null
          created_at: string
        }
        Insert: {
          email: string
          note?: string | null
          created_at?: string
        }
        Update: {
          email?: string
          note?: string | null
          created_at?: string
        }
      }
      payment_events: {
        Row: {
          id: string
          order_id: string | null
          event_type: string
          event_id: string | null
          payload: Json
          created_at: string
        }
        Insert: {
          id?: string
          order_id?: string | null
          event_type: string
          event_id?: string | null
          payload: Json
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string | null
          event_type?: string
          event_id?: string | null
          payload?: Json
          created_at?: string
        }
      }
      products: {
        Row: {
          id: number
          title: string
          brand: string
          category: string
          price: number
          original_price: number
          rating: number
          reviews_count: number
          stock: number
          type: 'S' | 'E'
          emoji: string
          description: string | null
          specs: string[] | Json
          flavors: string[] | Json
          batch_code: string | null
          authenticity_seal: string | null
          image: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          title: string
          brand: string
          category: string
          price: number
          original_price: number
          rating?: number
          reviews_count?: number
          stock?: number
          type: 'S' | 'E'
          emoji?: string
          description?: string | null
          specs?: string[] | Json
          flavors?: string[] | Json
          batch_code?: string | null
          authenticity_seal?: string | null
          image?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          title?: string
          brand?: string
          category?: string
          price?: number
          original_price?: number
          rating?: number
          reviews_count?: number
          stock?: number
          type?: 'S' | 'E'
          emoji?: string
          description?: string | null
          specs?: string[] | Json
          flavors?: string[] | Json
          batch_code?: string | null
          authenticity_seal?: string | null
          image?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      coupons: {
        Row: {
          id: number
          code: string
          discount_percent: number
          description: string | null
          active: boolean
          created_at: string
        }
        Insert: {
          id?: number
          code: string
          discount_percent: number
          description?: string | null
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          code?: string
          discount_percent?: number
          description?: string | null
          active?: boolean
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          customer_name: string
          customer_phone: string
          customer_address: string
          delivery_method: string
          payment_method: string
          subtotal: number
          discount_amount: number
          shipping_fee: number
          total_amount: number
          coupon_code: string | null
          status: string
          created_at: string
          user_id: string | null
          customer_email: string | null
          payment_status: 'unpaid' | 'pending' | 'paid' | 'expired' | 'failed' | 'review'
          payment_provider: string
          payment_intent_id: string | null
          payment_ref: string | null
          qr_code_url: string | null
          qr_expires_at: string | null
          paid_at: string | null
          receipt_sent_at: string | null
          receipt_error: string | null
        }
        Insert: {
          id?: string
          order_number: string
          customer_name: string
          customer_phone: string
          customer_address: string
          delivery_method: string
          payment_method: string
          subtotal: number
          discount_amount?: number
          shipping_fee?: number
          total_amount: number
          coupon_code?: string | null
          status?: string
          created_at?: string
          user_id?: string | null
          customer_email?: string | null
          payment_status?: 'unpaid' | 'pending' | 'paid' | 'expired' | 'failed' | 'review'
          payment_provider?: string
          payment_intent_id?: string | null
          payment_ref?: string | null
          qr_code_url?: string | null
          qr_expires_at?: string | null
          paid_at?: string | null
          receipt_sent_at?: string | null
          receipt_error?: string | null
        }
        Update: {
          id?: string
          order_number?: string
          customer_name?: string
          customer_phone?: string
          customer_address?: string
          delivery_method?: string
          payment_method?: string
          subtotal?: number
          discount_amount?: number
          shipping_fee?: number
          total_amount?: number
          coupon_code?: string | null
          status?: string
          created_at?: string
          user_id?: string | null
          customer_email?: string | null
          payment_status?: 'unpaid' | 'pending' | 'paid' | 'expired' | 'failed' | 'review'
          payment_provider?: string
          payment_intent_id?: string | null
          payment_ref?: string | null
          qr_code_url?: string | null
          qr_expires_at?: string | null
          paid_at?: string | null
          receipt_sent_at?: string | null
          receipt_error?: string | null
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: number | null
          product_title: string
          quantity: number
          unit_price: number
          subtotal: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: number | null
          product_title: string
          quantity: number
          unit_price: number
          subtotal: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: number | null
          product_title?: string
          quantity?: number
          unit_price?: number
          subtotal?: number
          created_at?: string
        }
      }
      batch_verifications: {
        Row: {
          id: number
          batch_code: string
          brand: string
          product_name: string
          production_date: string | null
          expiry_date: string | null
          purity: string | null
          origin: string | null
          fda_registration: string | null
          lab_notes: string | null
          verified: boolean
          created_at: string
        }
        Insert: {
          id?: number
          batch_code: string
          brand: string
          product_name: string
          production_date?: string | null
          expiry_date?: string | null
          purity?: string | null
          origin?: string | null
          fda_registration?: string | null
          lab_notes?: string | null
          verified?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          batch_code?: string
          brand?: string
          product_name?: string
          production_date?: string | null
          expiry_date?: string | null
          purity?: string | null
          origin?: string | null
          fda_registration?: string | null
          lab_notes?: string | null
          verified?: boolean
          created_at?: string
        }
      }
      wishlists: {
        Row: {
          id: string
          session_id: string
          product_id: number
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          product_id: number
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          product_id?: number
          created_at?: string
        }
      }
    }
  }
}
