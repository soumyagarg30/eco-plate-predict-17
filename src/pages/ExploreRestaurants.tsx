
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { DB_TABLES, RestaurantDetails } from "@/utils/dbUtils";
import UserSidebar from "@/components/user/UserSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";

const ExploreRestaurants = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [restaurants, setRestaurants] = useState<RestaurantDetails[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
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
      setIsLoading(true);
      const { data, error } = await supabase
        .from(DB_TABLES.RESTAURANTS)
        .select("id, restaurant_name, address, phone_number, email, created_at");
      
      if (error) {
        console.error("Error fetching restaurants:", error);
        throw error;
      }
      
      if (data) {
        setRestaurants(data as RestaurantDetails[]);
      }
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      toast({
        title: "Error",
        description: "Failed to load restaurants",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter restaurants based on search term
  const filteredRestaurants = restaurants.filter(restaurant => 
    restaurant.restaurant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (restaurant.address && restaurant.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-gray-50 w-full">
        <UserSidebar userName={userData?.name} />
        
        <div className="flex-1 p-6 md:p-10">
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Explore Restaurants
            </h1>
            <p className="text-gray-600">
              Discover restaurants and place orders
            </p>
          </header>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                type="text"
                placeholder="Search by name or address..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="h-48 animate-pulse">
                  <CardContent className="p-0">
                    <div className="h-full bg-gray-200"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {filteredRestaurants.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredRestaurants.map((restaurant) => (
                    <Card key={restaurant.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{restaurant.restaurant_name}</CardTitle>
                      </CardHeader>
                      <CardContent className="pb-4">
                        <div className="mb-4">
                          <p className="text-sm text-gray-500">{restaurant.address || "No address provided"}</p>
                          <p className="text-sm text-gray-500">
                            {restaurant.phone_number ? `Phone: ${restaurant.phone_number}` : ""}
                          </p>
                        </div>
                        <Button 
                          onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                          className="w-full"
                        >
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center p-12 bg-gray-50 rounded-lg">
                  <p className="text-xl text-gray-500 mb-4">No restaurants found</p>
                  <p className="text-gray-400">Try adjusting your search criteria</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ExploreRestaurants;
