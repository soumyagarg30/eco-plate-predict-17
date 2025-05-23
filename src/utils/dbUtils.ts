
// Database table name helpers to ensure consistent usage across the app
export const DB_TABLES = {
  RESTAURANTS: "restaurants_details" as const,
  NGOS: "Ngo's" as const,
  PACKING_REQUESTS: "packing_requests" as const,
  RESTAURANT_RATINGS: "restaurant_ratings" as const,
  USER_PREFERENCES: "user_preferences" as const,
  USER_DETAILS: "User_Details" as const,
  PACKING_COMPANIES: "Packing_Companies" as const,
  ADMIN: "Admin" as const,
} as const;

// Type for RestaurantsDetails table
export interface RestaurantDetails {
  id: number;
  restaurant_name: string;
  address?: string | null;
  phone_number?: string | null;
  email?: string | null;
  description?: string | null;
  created_at: string;
}

// Type for NGOs table
export interface NGO {
  id: number;
  name: string;
  contact: string;
  address?: string | null;
  phone_number?: string | null;
  email?: string | null;
  specialty?: string | null;
  created_at: string;
}

// Type for PackingRequests table
export interface PackingRequest {
  id: string;
  packing_company_id: number;
  requester_id: number;
  requester_type: 'ngo' | 'restaurant';
  request_title: string;
  request_description?: string | null;
  quantity: number;
  due_date: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  created_at: string;
  updated_at: string;
}
