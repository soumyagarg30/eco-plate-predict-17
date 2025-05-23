
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import UserSidebar from "@/components/user/UserSidebar";
import { LogOut } from "lucide-react";
import { DB_TABLES } from "@/utils/dbUtils";
import { SidebarProvider } from "@/components/ui/sidebar";

interface Restaurant {
  id: number;
  restaurant_name: string;
  address: string | null;
  phone_number: string | null;
  email: string | null;
  description: string | null;
  created_at: string;
}

const UserDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userData, setUserData] = useState<any>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    // Check if user is logged in as a regular user
    const userType = localStorage.getItem("foodieSync_userType");
    const userDataString = localStorage.getItem("foodieSync_userData");

    if (userType !== "user" || !userDataString) {
      setAuthError("Please login as a user to access this page");
      toast({
        title: "Unauthorized",
        description: "Please login as a user to access this page",
        variant: "destructive",
      });
      
      setTimeout(() => {
        navigate("/login");
      }, 1500);
      return;
    }

    try {
      const parsedData = JSON.parse(userDataString);
      setUserData(parsedData);
      setAuthError("");
      
      // Fetch restaurants from database
      fetchRestaurants();
    } catch (error) {
      console.error("Error parsing user data:", error);
      setAuthError("Invalid user data. Please login again.");
      
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } finally {
      setIsLoading(false);
    }
  }, [navigate, toast]);
  
  const fetchRestaurants = async () => {
    try {
      // Use exact table name from DB_TABLES constant with correct casing
      const { data, error } = await supabase
        .from(DB_TABLES.RESTAURANTS)
        .select("*");
      
      if (error) {
        console.error("Error fetching restaurants:", error);
        throw error;
      }
      
      if (data) {
        // Ensure we're only getting restaurants with the expected shape
        const validRestaurants = data.filter((item): item is Restaurant => 
          'restaurant_name' in item && typeof item.restaurant_name === 'string'
        );
        setRestaurants(validRestaurants);
      }
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      toast({
        title: "Error",
        description: "Failed to load restaurants",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("foodieSync_userType");
    localStorage.removeItem("foodieSync_userData");
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
    navigate("/login");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex items-center justify-center h-screen flex-col gap-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{authError}</AlertDescription>
        </Alert>
        <Button onClick={() => navigate("/login")}>Go to Login</Button>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-gray-50 w-full">
        <UserSidebar userName={userData?.name} />
        
        <div className="flex-1 p-6 md:p-10">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome, {userData?.name}!
            </h1>
            <p className="text-gray-600">
              Explore restaurants and manage your preferences
            </p>
          </header>

          <section className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Nearby Restaurants</CardTitle>
                <CardDescription>
                  Discover restaurants in your area
                </CardDescription>
              </CardHeader>
              <CardContent>
                {restaurants.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Email</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {restaurants.map((restaurant) => (
                          <TableRow key={restaurant.id}>
                            <TableCell className="font-medium">
                              {restaurant.restaurant_name}
                            </TableCell>
                            <TableCell>{restaurant.address || "N/A"}</TableCell>
                            <TableCell>{restaurant.phone_number || "N/A"}</TableCell>
                            <TableCell>{restaurant.email || "N/A"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center p-6 bg-gray-50 rounded-md">
                    <p className="text-gray-500">No restaurants found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
          
          <Button 
            variant="ghost" 
            className="flex items-center gap-2 hover:bg-gray-100"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default UserDashboard;
