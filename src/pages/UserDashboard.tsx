
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import UserSidebar from "@/components/user/UserSidebar";
import { DB_TABLES, RestaurantDetails } from "@/utils/dbUtils";
import { SidebarProvider } from "@/components/ui/sidebar";

interface Restaurant {
  id: number;
  restaurant_name: string;
  address: string | null;
  phone_number: number | null;
  email: string | null;
  created_at: string;
}

const UserDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userData, setUserData] = useState<any>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
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
      // Fetch user's recent orders
      fetchRecentOrders(parsedData.id);
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
      const { data, error } = await supabase
        .from(DB_TABLES.RESTAURANTS)
        .select("id, restaurant_name, address, phone_number, email, created_at")
        .limit(5);
      
      if (error) {
        console.error("Error fetching restaurants:", error);
        throw error;
      }
      
      if (data) {
        setRestaurants(data as Restaurant[]);
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

  const fetchRecentOrders = async (userId: number) => {
    try {
      const { data, error } = await supabase
        .from("user_orders")
        .select(`
          id, 
          order_date, 
          total_amount, 
          status, 
          ${DB_TABLES.RESTAURANTS}:restaurant_id (restaurant_name)
        `)
        .eq("user_id", userId)
        .order("order_date", { ascending: false })
        .limit(5);

      if (error) {
        console.error("Error fetching recent orders:", error);
        throw error;
      }

      if (data) {
        setRecentOrders(data);
      }
    } catch (error) {
      console.error("Error fetching recent orders:", error);
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
              Explore restaurants and manage your orders
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>
                  Your most recent food orders
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentOrders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Restaurant</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">
                              {order[DB_TABLES.RESTAURANTS]?.restaurant_name || "Unknown"}
                            </TableCell>
                            <TableCell>
                              {new Date(order.order_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>${order.total_amount.toFixed(2)}</TableCell>
                            <TableCell>
                              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                {order.status}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center p-6 bg-gray-50 rounded-md">
                    <p className="text-gray-500">No recent orders found</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommended Restaurants</CardTitle>
                <CardDescription>
                  Popular restaurants you might enjoy
                </CardDescription>
              </CardHeader>
              <CardContent>
                {restaurants.length > 0 ? (
                  <div className="space-y-4">
                    {restaurants.slice(0, 3).map((restaurant) => (
                      <div key={restaurant.id} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{restaurant.restaurant_name}</p>
                          <p className="text-sm text-gray-500">{restaurant.address || "No address"}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                        >
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-6 bg-gray-50 rounded-md">
                    <p className="text-gray-500">No restaurants found</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => navigate("/explore-restaurants")}
                >
                  See All Restaurants
                </Button>
              </CardFooter>
            </Card>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button 
                  className="w-full h-auto py-4 flex flex-col items-center gap-2"
                  onClick={() => navigate("/explore-restaurants")}
                >
                  <span className="text-lg">Explore Restaurants</span>
                  <span className="text-xs font-normal">Find new places to eat</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-auto py-4 flex flex-col items-center gap-2"
                  onClick={() => navigate("/user-settings")}
                >
                  <span className="text-lg">User Settings</span>
                  <span className="text-xs font-normal">Manage your account</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default UserDashboard;
