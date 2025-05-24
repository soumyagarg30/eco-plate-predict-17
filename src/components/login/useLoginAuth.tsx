
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useLoginAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Custom fetch wrapper for direct authentication without using user_auth table
  const directAuth = async (email: string, password: string, userType: string) => {
    // Determine which table to check based on userType
    let tableName: string;
    
    switch (userType) {
      case "restaurant":
        tableName = "Restaurants_Details";
        break;
      case "user":
        tableName = "User_Details";
        break;
      case "ngo":
        tableName = "Ngo's";
        break;
      case "packing":
        tableName = "Packing_Companies";
        break;
      case "admin":
        tableName = "Admin";
        break;
      default:
        throw new Error("Invalid user type");
    }
    
    // Query the appropriate table directly
    const { data, error } = await supabase
      .from(tableName as any)
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single();
    
    if (error) throw error;
    return data;
  };

  const login = async (email: string, password: string, userType: string) => {
    setIsLoading(true);
    setError("");
    
    try {
      const userData = await directAuth(email, password, userType);
      return { success: true, userData };
    } catch (err: any) {
      setError(err.message || "Login failed");
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  return { login, isLoading, error };
};
