
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DB_TABLES } from "@/utils/dbUtils";

const RegisterForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userType, setUserType] = useState("restaurant");
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: ""
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Insert data into the appropriate table based on user type
      let insertResult;
      let tableName;
      let insertData: any = {};

      switch (userType) {
        case "restaurant":
          tableName = DB_TABLES.RESTAURANTS; // Using constant from dbUtils
          insertData = {
            restaurant_name: formData.name,
            email: formData.email,
            password: formData.password,
            phone_number: formData.phone,
            address: formData.address
          };
          break;
        
        case "user":
          tableName = DB_TABLES.USER_DETAILS; // Using constant from dbUtils
          insertData = {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            phone_number: formData.phone
          };
          break;
        
        case "ngo":
          tableName = DB_TABLES.NGOS; // Using constant from dbUtils
          insertData = {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            phone_number: formData.phone,
            address: formData.address
          };
          break;
        
        case "packing":
          tableName = DB_TABLES.PACKING_COMPANIES; // Using constant from dbUtils
          insertData = {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            phone_number: formData.phone,
            address: formData.address
          };
          break;
        
        case "admin":
          tableName = DB_TABLES.ADMIN; // Using constant from dbUtils
          insertData = {
            username: formData.name,
            email: formData.email,
            password: formData.password,
            phone_number: formData.phone
          };
          break;
      }

      console.log(`Attempting to insert into ${tableName}:`, insertData);

      insertResult = await supabase
        .from(tableName)
        .insert(insertData);

      if (insertResult.error) {
        throw insertResult.error;
      }

      toast({
        title: "Registration Successful",
        description: `Your ${userType} account has been created!`,
      });
      
      // Redirect to login page after successful registration
      navigate("/login");
      
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: error.message || "An error occurred during registration",
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
            Register with FoodieSync
          </CardTitle>
          <CardDescription className="text-center">
            Create your account to get started
          </CardDescription>
        </CardHeader>
        
        <Tabs defaultValue="restaurant" onValueChange={setUserType} className="w-full">
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="restaurant">Restaurant</TabsTrigger>
            <TabsTrigger value="user">User</TabsTrigger>
            <TabsTrigger value="ngo">NGO</TabsTrigger>
            <TabsTrigger value="packing">Packing</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>
          
          {["restaurant", "user", "ngo", "packing", "admin"].map((type) => (
            <TabsContent key={type} value={type}>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`${type}-name`}>
                      {type === "restaurant" ? "Restaurant Name" : 
                       type === "ngo" ? "NGO Name" :
                       type === "packing" ? "Company Name" :
                       type === "admin" ? "Username" :
                       "Full Name"}
                    </Label>
                    <Input 
                      id={`${type}-name`} 
                      name="name"
                      placeholder={type === "restaurant" ? "Your Restaurant Name" : 
                                   type === "ngo" ? "Your NGO Name" :
                                   type === "packing" ? "Your Company Name" :
                                   type === "admin" ? "Admin Username" :
                                   "Your Full Name"} 
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`${type}-email`}>Email</Label>
                    <Input 
                      id={`${type}-email`} 
                      name="email"
                      type="email" 
                      placeholder="your@email.com" 
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`${type}-phone`}>Phone Number</Label>
                    <Input 
                      id={`${type}-phone`} 
                      name="phone"
                      type="tel" 
                      placeholder="(123) 456-7890" 
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                  
                  {(type === "restaurant" || type === "ngo" || type === "packing") && (
                    <div className="space-y-2">
                      <Label htmlFor={`${type}-address`}>
                        {type === "restaurant" ? "Restaurant Address" : 
                         type === "ngo" ? "NGO Address" : 
                         "Company Address"}
                      </Label>
                      <Input 
                        id={`${type}-address`} 
                        name="address"
                        placeholder="123 Main Street, City" 
                        value={formData.address}
                        onChange={handleChange}
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor={`${type}-password`}>Password</Label>
                    <Input 
                      id={`${type}-password`} 
                      name="password"
                      type="password" 
                      placeholder="••••••••" 
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`${type}-confirm-password`}>Confirm Password</Label>
                    <Input 
                      id={`${type}-confirm-password`} 
                      name="confirmPassword"
                      type="password" 
                      placeholder="••••••••" 
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-foodie-green hover:bg-foodie-green-dark"
                    disabled={isLoading}
                  >
                    {isLoading ? "Registering..." : "Register"}
                  </Button>
                </form>
              </CardContent>
              
              <CardFooter className="flex flex-col">
                <div className="text-sm text-center">
                  Already have an account?{" "}
                  <Link to="/login" className="text-foodie-yellow hover:underline">
                    Login
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

export default RegisterForm;
