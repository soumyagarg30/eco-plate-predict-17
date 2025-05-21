export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      Admin: {
        Row: {
          created_at: string
          email: string
          id: number
          password: string
          phone_number: number | null
          username: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: number
          password: string
          phone_number?: number | null
          username: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: number
          password?: string
          phone_number?: number | null
          username?: string
        }
        Relationships: []
      }
      "Ngo's": {
        Row: {
          address: string | null
          created_at: string
          email: string
          id: number
          name: string
          password: string
          phone_number: number | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          email: string
          id?: number
          name: string
          password: string
          phone_number?: number | null
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string
          id?: number
          name?: string
          password?: string
          phone_number?: number | null
        }
        Relationships: []
      }
      Packing_Companies: {
        Row: {
          address: string | null
          created_at: string
          email: string
          id: number
          name: string
          password: string
          phone_number: number | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          email: string
          id?: number
          name: string
          password: string
          phone_number?: number | null
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string
          id?: number
          name?: string
          password?: string
          phone_number?: number | null
        }
        Relationships: []
      }
      packing_requests: {
        Row: {
          created_at: string
          due_date: string
          id: string
          packing_company_id: number | null
          quantity: number
          request_description: string
          request_title: string
          requester_id: number
          requester_type: string
          status: string
        }
        Insert: {
          created_at?: string
          due_date: string
          id?: string
          packing_company_id?: number | null
          quantity: number
          request_description: string
          request_title: string
          requester_id: number
          requester_type: string
          status?: string
        }
        Update: {
          created_at?: string
          due_date?: string
          id?: string
          packing_company_id?: number | null
          quantity?: number
          request_description?: string
          request_title?: string
          requester_id?: number
          requester_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "packing_requests_packing_company_id_fkey"
            columns: ["packing_company_id"]
            isOneToOne: false
            referencedRelation: "Packing_Companies"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_ratings: {
        Row: {
          created_at: string
          id: string
          rating: number
          restaurant_id: number
          review: string | null
          user_id: number
        }
        Insert: {
          created_at?: string
          id?: string
          rating: number
          restaurant_id: number
          review?: string | null
          user_id: number
        }
        Update: {
          created_at?: string
          id?: string
          rating?: number
          restaurant_id?: number
          review?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_ratings_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "Restaurants_Details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "User_Details"
            referencedColumns: ["id"]
          },
        ]
      }
      Restaurants_Details: {
        Row: {
          address: string | null
          created_at: string
          email: string
          id: number
          password: string
          phone_number: number
          restaurant_name: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email: string
          id?: number
          password: string
          phone_number: number
          restaurant_name: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string
          id?: number
          password?: string
          phone_number?: number
          restaurant_name?: string
        }
        Relationships: []
      }
      User_Details: {
        Row: {
          created_at: string
          email: string
          id: number
          name: string
          password: string
          phone_number: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: number
          name: string
          password: string
          phone_number?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: number
          name?: string
          password?: string
          phone_number?: string | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          ac_preference: boolean | null
          avg_quantity_ordered: number | null
          created_at: string
          dietary_restrictions: string[] | null
          family_members: number | null
          favorite_foods: string[]
          id: string
          updated_at: string
          user_id: number
        }
        Insert: {
          ac_preference?: boolean | null
          avg_quantity_ordered?: number | null
          created_at?: string
          dietary_restrictions?: string[] | null
          family_members?: number | null
          favorite_foods?: string[]
          id?: string
          updated_at?: string
          user_id: number
        }
        Update: {
          ac_preference?: boolean | null
          avg_quantity_ordered?: number | null
          created_at?: string
          dietary_restrictions?: string[] | null
          family_members?: number | null
          favorite_foods?: string[]
          id?: string
          updated_at?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "User_Details"
            referencedColumns: ["id"]
          },
        ]
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
