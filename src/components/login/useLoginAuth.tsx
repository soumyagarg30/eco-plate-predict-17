
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserTypes } from "./LoginTabs";

type TableNames = "Restaurants_Details" | "User_Details" | "Ngo's" | "Packing_Companies" | "Admin";

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
      // Query the appropriate table based on user type
      let tableName: TableNames;
      
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
      }
      
      console.log(`Attempting to log in as ${userType}. Querying table: ${tableName}`);
      console.log(`Email: ${email}, Password: ${password}`);
      
      // Find accounts with matching email (case-insensitive)
      const { data: emailData, error: emailError } = await supabase
        .from(tableName)
        .select("*")
        .ilike("email", email);
        
      if (emailError) {
        console.error("Error checking email:", emailError);
        throw new Error(emailError.message || "Error checking email");
      }
      
      // Check if any emails were found
      if (!emailData || emailData.length === 0) {
        console.log("No matching email found in database");
        setLoginError("Invalid email or password");
        throw new Error("Invalid email or password");
      }
      
      console.log("Found potential email matches:", emailData);
      
      // Check if any of the returned accounts have the correct password
      const matchingUser = emailData.find(user => {
        // Ensure we're safely accessing the password property
        if (user && typeof user === 'object' && 'password' in user) {
          return user.password === password;
        }
        return false;
      });
      
      if (!matchingUser) {
        console.log("Password doesn't match for any found email");
        setLoginError("Invalid email or password");
        throw new Error("Invalid email or password");
      }
      
      console.log("User authenticated successfully:", matchingUser);
      
      toast({
        title: "Login Successful",
        description: `Welcome back to FoodieSync as a ${userType}!`,
      });
      
      // Store user info in localStorage for persistence
      localStorage.setItem("foodieSync_userType", userType);
      localStorage.setItem("foodieSync_userData", JSON.stringify(matchingUser));
      
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
      setLoginError(error.message || "Invalid email or password");
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
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
