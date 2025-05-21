
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Database } from "@/integrations/supabase/types";

// Define types for better TypeScript support
type UserTypes = "restaurant" | "user" | "ngo" | "packing" | "admin";
type TableNames = "Restaurants_Details" | "User_Details" | "Ngo's" | "Packing_Companies" | "Admin";

type TableData = {
  id: number;
  Email?: string | null;
  Password?: string | null;
  [key: string]: any; // Allow for other properties that might exist in each user type
}

const LoginForm = () => {
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
        .ilike("Email", email);
        
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
      // TypeScript safe approach by properly typing the data
      const matchingUser = emailData.find(user => {
        // Ensure we're safely accessing the Password property
        if (user && typeof user === 'object' && 'Password' in user) {
          return user.Password === password;
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
  
  return (
    <div className="container mx-auto px-6 py-12 flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-foodie-green-dark">
            Login to FoodieSync
          </CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        
        <Tabs defaultValue={userType} onValueChange={(value) => setUserType(value as UserTypes)} className="w-full">
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="restaurant">Restaurant</TabsTrigger>
            <TabsTrigger value="user">User</TabsTrigger>
            <TabsTrigger value="ngo">NGO</TabsTrigger>
            <TabsTrigger value="packing">Packing</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>
          
          {loginError && (
            <Alert variant="destructive" className="mb-4 mx-6">
              <AlertDescription>{loginError}</AlertDescription>
            </Alert>
          )}
          
          {["restaurant", "user", "ngo", "packing", "admin"].map((type) => (
            <TabsContent key={type} value={type}>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`${type}-email`}>Email</Label>
                    <Input 
                      id={`${type}-email`} 
                      type="email" 
                      placeholder="your@email.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor={`${type}-password`}>Password</Label>
                      <Link to="/forgot-password" className="text-sm text-foodie-yellow hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <Input 
                      id={`${type}-password`} 
                      type="password" 
                      placeholder="••••••••" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-foodie-green hover:bg-foodie-green-dark"
                    disabled={isLoading}
                  >
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </CardContent>
              
              <CardFooter className="flex flex-col">
                <div className="text-sm text-center">
                  Don't have an account?{" "}
                  <Link 
                    to={`/${type === "restaurant" ? "register" : `${type}-register`}`}
                    className="text-foodie-yellow hover:underline"
                  >
                    Register
                  </Link>
                </div>
              </CardFooter>
            </TabsContent>
          ))}
        </Tabs>
      </Card>
    </div>
  );
};

export default LoginForm;
