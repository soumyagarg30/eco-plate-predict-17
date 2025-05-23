
// Database table name helpers to ensure consistent usage across the app
export const DB_TABLES = {
  RESTAURANTS: "restaurants_details" as const,
  NGOS: "Ngo's" as const,
  PACKING_REQUESTS: "packing_requests" as const,
  RESTAURANT_RATINGS: "restaurant_ratings" as const,
  USER_PREFERENCES: "user_preferences" as const,
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
