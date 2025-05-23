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
      "Ngo's": {
        Row: {
          address: string | null
          contact: string
          created_at: string
          email: string | null
          id: number
          name: string
          phone_number: string | null
          specialty: string | null
        }
        Insert: {
          address?: string | null
          contact: string
          created_at?: string
          email?: string | null
          id?: number
          name: string
          phone_number?: string | null
          specialty?: string | null
        }
        Update: {
          address?: string | null
          contact?: string
          created_at?: string
          email?: string | null
          id?: number
          name?: string
          phone_number?: string | null
          specialty?: string | null
        }
        Relationships: []
      }
      packing_requests: {
        Row: {
          created_at: string
          due_date: string
          id: string
          packing_company_id: number
          quantity: number
          request_description: string | null
          request_title: string
          requester_id: number
          requester_type: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          due_date: string
          id?: string
          packing_company_id: number
          quantity: number
          request_description?: string | null
          request_title: string
          requester_id: number
          requester_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          due_date?: string
          id?: string
          packing_company_id?: number
          quantity?: number
          request_description?: string | null
          request_title?: string
          requester_id?: number
          requester_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      restaurant_ratings: {
        Row: {
          created_at: string
          id: number
          rating: number
          restaurant_id: number
          review: string | null
          updated_at: string
          user_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          rating: number
          restaurant_id: number
          review?: string | null
          updated_at?: string
          user_id: number
        }
        Update: {
          created_at?: string
          id?: number
          rating?: number
          restaurant_id?: number
          review?: string | null
          updated_at?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_ratings_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_details"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants_details: {
        Row: {
          address: string | null
          created_at: string
          description: string | null
          email: string | null
          id: number
          phone_number: string | null
          restaurant_name: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: number
          phone_number?: string | null
          restaurant_name: string
        }
        Update: {
          address?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: number
          phone_number?: string | null
          restaurant_name?: string
        }
        Relationships: []
      }
      user_auth: {
        Row: {
          created_at: string
          email: string
          id: string
          password: string
          user_type: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          password: string
          user_type: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          password?: string
          user_type?: string
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
          favorite_foods: string[] | null
          id: number
          updated_at: string
          user_id: number
        }
        Insert: {
          ac_preference?: boolean | null
          avg_quantity_ordered?: number | null
          created_at?: string
          dietary_restrictions?: string[] | null
          family_members?: number | null
          favorite_foods?: string[] | null
          id?: number
          updated_at?: string
          user_id: number
        }
        Update: {
          ac_preference?: boolean | null
          avg_quantity_ordered?: number | null
          created_at?: string
          dietary_restrictions?: string[] | null
          family_members?: number | null
          favorite_foods?: string[] | null
          id?: number
          updated_at?: string
          user_id?: number
        }
        Relationships: []
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
