
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserTypes } from "./LoginTabs";
import { DB_TABLES } from "@/utils/dbUtils";

export const useLoginAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userType, setUserType] = useState<UserTypes>("restaurant");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Check if user is already logged in on component mount
  useEffect(() => {
    const checkExistingSession = () => {
      const userType = localStorage.getItem("foodieSync_userType");
      const userData = localStorage.getItem("foodieSync_userData");
      
      if (userType && userData) {
        // Redirect to appropriate dashboard based on user type
        if (userType === "restaurant") {
          navigate("/restaurant-dashboard");
        } else if (userType === "user") {
          navigate("/user-dashboard");
        } else if (userType === "ngo") {
          navigate("/ngo-dashboard");
        } else if (userType === "packing") {
          navigate("/packing-dashboard");
        } else if (userType === "admin") {
          navigate("/admin-dashboard");
        }
      }
    };
    
    checkExistingSession();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    
    // Basic validation
    if (!email || !password) {
      setLoginError("Please fill in all fields");
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // First, authenticate with user_auth table
      const { data: authData, error: authError } = await supabase
        .from('user_auth')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .eq('user_type', userType)
        .single();
      
      if (authError || !authData) {
        console.error("Auth error:", authError);
        throw new Error("Invalid email or password");
      }
      
      console.log(`Auth successful for ${userType} user:`, authData);
      
      // Now fetch the user details from the appropriate table based on user type
      let tableName: string;
      let userData;
      
      switch (userType) {
        case "restaurant":
          tableName = DB_TABLES.RESTAURANTS;
          break;
        case "user":
          tableName = DB_TABLES.USER_DETAILS;
          break;
        case "ngo":
          tableName = DB_TABLES.NGOS;
          break;
        case "packing":
          tableName = DB_TABLES.PACKING_COMPANIES;
          break;
        case "admin":
          tableName = DB_TABLES.ADMIN;
          break;
        default:
          throw new Error("Invalid user type");
      }
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('email', email)
        .single();
        
      if (error) {
        console.error("Error fetching user data:", error);
        throw new Error("Error retrieving user information");
      }
      
      userData = data;
      
      toast({
        title: "Login Successful",
        description: `Welcome back to FoodieSync as a ${userType}!`,
      });
      
      // Store user info in localStorage for persistence
      localStorage.setItem("foodieSync_userType", userType);
      localStorage.setItem("foodieSync_userData", JSON.stringify(userData));
      
      console.log(`Successfully logged in as ${userType}. Redirecting to dashboard.`);
      
      // Redirect based on user type
      if (userType === "restaurant") {
        navigate("/restaurant-dashboard");
      } else if (userType === "user") {
        navigate("/user-dashboard");
      } else if (userType === "ngo") {
        navigate("/ngo-dashboard");
      } else if (userType === "packing") {
        navigate("/packing-dashboard");
      } else {
        navigate("/admin-dashboard");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      setLoginError(error?.message || "Invalid email or password");
      toast({
        title: "Login Failed",
        description: error?.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    userType,
    setUserType,
    isLoading,
    email,
    setEmail,
    password,
    setPassword,
    loginError,
    handleLogin
  };
};
