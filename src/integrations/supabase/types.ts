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
      ml_model_data: {
        Row: {
          created_at: string | null
          id: string
          input_data: Json
          metadata: Json | null
          model_type: string
          output_data: Json
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          input_data: Json
          metadata?: Json | null
          model_type: string
          output_data: Json
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          input_data?: Json
          metadata?: Json | null
          model_type?: string
          output_data?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      ngo_food_requests: {
        Row: {
          created_at: string
          due_date: string
          id: string
          ngo_id: number
          quantity: number
          request_description: string
          request_title: string
          restaurant_id: number
          status: string
        }
        Insert: {
          created_at?: string
          due_date: string
          id?: string
          ngo_id: number
          quantity: number
          request_description: string
          request_title: string
          restaurant_id: number
          status?: string
        }
        Update: {
          created_at?: string
          due_date?: string
          id?: string
          ngo_id?: number
          quantity?: number
          request_description?: string
          request_title?: string
          restaurant_id?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ngo_food_requests_ngo_id_fkey"
            columns: ["ngo_id"]
            isOneToOne: false
            referencedRelation: "Ngo's"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ngo_food_requests_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "Restaurants_Details"
            referencedColumns: ["id"]
          },
        ]
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
          verified: boolean | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          email: string
          id?: number
          name: string
          password: string
          phone_number?: number | null
          verified?: boolean | null
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string
          id?: number
          name?: string
          password?: string
          phone_number?: number | null
          verified?: boolean | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          carbon_footprint_per_unit: number | null
          id: string
          menu_item_id: string | null
          menu_item_name: string
          order_id: string
          price_per_unit: number
          quantity: number
          special_requests: string | null
          total_price: number
        }
        Insert: {
          carbon_footprint_per_unit?: number | null
          id?: string
          menu_item_id?: string | null
          menu_item_name: string
          order_id: string
          price_per_unit: number
          quantity: number
          special_requests?: string | null
          total_price: number
        }
        Update: {
          carbon_footprint_per_unit?: number | null
          id?: string
          menu_item_id?: string | null
          menu_item_name?: string
          order_id?: string
          price_per_unit?: number
          quantity?: number
          special_requests?: string | null
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "restaurant_menu_items"
            referencedColumns: ["id"]
          },
        ]
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
          verified: boolean | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          email: string
          id?: number
          name: string
          password: string
          phone_number?: number | null
          verified?: boolean | null
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string
          id?: number
          name?: string
          password?: string
          phone_number?: number | null
          verified?: boolean | null
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
      restaurant_feedback: {
        Row: {
          ac_rating: number | null
          cleanliness_rating: number | null
          comments: string | null
          created_at: string
          environment_rating: number | null
          food_rating: number
          id: string
          order_id: string | null
          packaging_rating: number | null
          restaurant_id: number
          user_id: number
        }
        Insert: {
          ac_rating?: number | null
          cleanliness_rating?: number | null
          comments?: string | null
          created_at?: string
          environment_rating?: number | null
          food_rating: number
          id?: string
          order_id?: string | null
          packaging_rating?: number | null
          restaurant_id: number
          user_id: number
        }
        Update: {
          ac_rating?: number | null
          cleanliness_rating?: number | null
          comments?: string | null
          created_at?: string
          environment_rating?: number | null
          food_rating?: number
          id?: string
          order_id?: string | null
          packaging_rating?: number | null
          restaurant_id?: number
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_feedback_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "user_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_feedback_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "Restaurants_Details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "User_Details"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_menu_items: {
        Row: {
          carbon_footprint: number | null
          created_at: string
          description: string | null
          id: string
          is_available: boolean | null
          is_vegan: boolean | null
          is_vegetarian: boolean | null
          name: string
          price: number
          restaurant_id: number
        }
        Insert: {
          carbon_footprint?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_available?: boolean | null
          is_vegan?: boolean | null
          is_vegetarian?: boolean | null
          name: string
          price: number
          restaurant_id: number
        }
        Update: {
          carbon_footprint?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_available?: boolean | null
          is_vegan?: boolean | null
          is_vegetarian?: boolean | null
          name?: string
          price?: number
          restaurant_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_menu_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "Restaurants_Details"
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
          verified: boolean | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          email: string
          id?: number
          password: string
          phone_number: number
          restaurant_name: string
          verified?: boolean | null
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string
          id?: number
          password?: string
          phone_number?: number
          restaurant_name?: string
          verified?: boolean | null
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
          verified: boolean | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: number
          name: string
          password: string
          phone_number?: string | null
          verified?: boolean | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: number
          name?: string
          password?: string
          phone_number?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      user_orders: {
        Row: {
          carbon_footprint: number | null
          id: string
          items: Json
          order_date: string
          restaurant_id: number
          status: string
          total_amount: number
          user_id: number
        }
        Insert: {
          carbon_footprint?: number | null
          id?: string
          items: Json
          order_date?: string
          restaurant_id: number
          status?: string
          total_amount: number
          user_id: number
        }
        Update: {
          carbon_footprint?: number | null
          id?: string
          items?: Json
          order_date?: string
          restaurant_id?: number
          status?: string
          total_amount?: number
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "Restaurants_Details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "User_Details"
            referencedColumns: ["id"]
          },
        ]
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
      store_ml_data: {
        Args: {
          p_model_type: string
          p_input_data: Json
          p_output_data: Json
          p_metadata?: Json
        }
        Returns: string
      }
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
