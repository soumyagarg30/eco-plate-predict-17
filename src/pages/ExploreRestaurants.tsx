
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

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_vegetarian: boolean | null;
  is_vegan: boolean | null;
}

interface RestaurantWithMenu extends RestaurantDetails {
  menuItems: MenuItem[];
}

const ExploreRestaurants = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [restaurants, setRestaurants] = useState<RestaurantWithMenu[]>([]);
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
      
      fetchRestaurantsWithMenu();
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

  const fetchRestaurantsWithMenu = async () => {
    try {
      setIsLoading(true);
      const { data: restaurantsData, error: restaurantsError } = await supabase
        .from(DB_TABLES.RESTAURANTS)
        .select("id, restaurant_name, address, phone_number, email, created_at");
      
      if (restaurantsError) {
        console.error("Error fetching restaurants:", restaurantsError);
        throw restaurantsError;
      }
      
      if (restaurantsData) {
        // Fetch menu items for each restaurant
        const restaurantsWithMenu = await Promise.all(
          restaurantsData.map(async (restaurant) => {
            const { data: menuData, error: menuError } = await supabase
              .from("restaurant_menu_items")
              .select("id, name, description, price, is_vegetarian, is_vegan")
              .eq("restaurant_id", restaurant.id)
              .eq("is_available", true)
              .limit(3); // Show only first 3 items as preview
            
            if (menuError) {
              console.error("Error fetching menu for restaurant:", restaurant.id, menuError);
              return { ...restaurant, menuItems: [] };
            }
            
            return { ...restaurant, menuItems: menuData || [] };
          })
        );
        
        setRestaurants(restaurantsWithMenu as RestaurantWithMenu[]);
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
                <Card key={i} className="h-96 animate-pulse">
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
                        
                        {/* Menu Items Preview */}
                        <div className="mb-4">
                          <h4 className="font-medium text-sm mb-2">Sample Menu Items:</h4>
                          {restaurant.menuItems.length > 0 ? (
                            <div className="space-y-2">
                              {restaurant.menuItems.map((item) => (
                                <div key={item.id} className="flex justify-between items-start text-xs">
                                  <div className="flex-1">
                                    <span className="font-medium">{item.name}</span>
                                    {item.description && (
                                      <p className="text-gray-500 text-xs truncate">{item.description}</p>
                                    )}
                                    <div className="flex gap-1 mt-1">
                                      {item.is_vegetarian && <span className="bg-green-100 text-green-800 px-1 py-0.5 rounded text-xs">Veg</span>}
                                      {item.is_vegan && <span className="bg-green-100 text-green-800 px-1 py-0.5 rounded text-xs">Vegan</span>}
                                    </div>
                                  </div>
                                  <span className="font-medium text-sm">${item.price.toFixed(2)}</span>
                                </div>
                              ))}
                              {restaurant.menuItems.length === 3 && (
                                <p className="text-xs text-gray-400 italic">+ more items available</p>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400">No menu items available</p>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                            className="flex-1"
                          >
                            View Details
                          </Button>
                          <Button 
                            onClick={() => navigate(`/restaurant/${restaurant.id}?tab=menu`)}
                            variant="outline"
                            className="flex-1"
                          >
                            Order Now
                          </Button>
                        </div>
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
