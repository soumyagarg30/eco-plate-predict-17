
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserTypes } from "./LoginTabs";

export const useLoginAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [userType, setUserType] = useState<UserTypes>("restaurant");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

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
    if (!data) throw new Error("Invalid credentials");
    
    return data;
  };

  const login = async (email: string, password: string, userType: string) => {
    setIsLoading(true);
    setError("");
    
    try {
      const userData = await directAuth(email, password, userType);
      
      // Check verification status for non-admin users
      if (userType !== "admin") {
        // Safely check if verified property exists and is true
        const isVerified = userData && typeof userData === 'object' && userData !== null && 'verified' in userData && userData.verified === true;
        if (!isVerified) {
          throw new Error("Your account is not verified yet. Please wait for admin approval.");
        }
      }
      
      // Store user data in localStorage
      localStorage.setItem("foodieSync_userType", userType);
      localStorage.setItem("foodieSync_userData", JSON.stringify(userData));
      
      // Show success toast
      toast({
        title: "Login Successful",
        description: `Welcome back!`,
      });
      
      // Navigate to appropriate dashboard
      switch (userType) {
        case "restaurant":
          navigate("/restaurant-dashboard");
          break;
        case "user":
          navigate("/user-dashboard");
          break;
        case "ngo":
          navigate("/ngo-dashboard");
          break;
        case "packing":
          navigate("/packing-dashboard");
          break;
        case "admin":
          navigate("/admin-dashboard");
          break;
        default:
          navigate("/");
      }
      
      return { success: true, userData };
    } catch (err: any) {
      setError(err.message || "Login failed");
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password, userType);
  };

  return { 
    login, 
    isLoading, 
    error: error,
    userType,
    setUserType,
    email,
    setEmail,
    password,
    setPassword,
    loginError: error,
    handleLogin
  };
};
