import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, ShoppingCart, MapPin, Phone, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { DB_TABLES, RestaurantDetails } from "@/utils/dbUtils";
import UserSidebar from "@/components/user/UserSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

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
  const [expandedRestaurants, setExpandedRestaurants] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Check if user is logged in as a regular user
    const userType = localStorage.getItem("foodieSync_userType");
    const userDataString = localStorage.getItem("foodieSync_userData");

    if (userType !== "user" || !userDataString) {
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
      
      fetchRestaurantsWithMenu();
    } catch (error) {
      console.error("Error parsing user data:", error);
      
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
              .eq("is_available", true);
            
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

  const toggleRestaurantExpansion = (restaurantId: number) => {
    setExpandedRestaurants(prev => {
      const newSet = new Set(prev);
      if (newSet.has(restaurantId)) {
        newSet.delete(restaurantId);
      } else {
        newSet.add(restaurantId);
      }
      return newSet;
    });
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
        
        <div className="flex-1 p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Explore Restaurants
              </h1>
              <p className="text-lg text-gray-600">
                Discover amazing restaurants and place your orders
              </p>
            </div>

            <div className="mb-8">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search restaurants or locations..."
                  className="pl-10 h-12 text-base"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                    <CardContent className="p-6">
                      <div className="h-6 bg-gray-200 rounded mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                {filteredRestaurants.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRestaurants.map((restaurant) => (
                      <Card key={restaurant.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0 shadow-md">
                        {/* Restaurant Image Placeholder */}
                        <div className="h-48 bg-gradient-to-br from-green-100 to-green-200 relative">
                          <div className="absolute inset-0 bg-black/10"></div>
                          <div className="absolute top-4 right-4">
                            <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <span className="text-sm font-medium">4.5</span>
                            </div>
                          </div>
                        </div>
                        
                        <CardContent className="p-6">
                          <div className="mb-4">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                              {restaurant.restaurant_name}
                            </h3>
                            
                            <div className="space-y-2 text-sm text-gray-600">
                              {restaurant.address && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-gray-400" />
                                  <span>{restaurant.address}</span>
                                </div>
                              )}
                              {restaurant.phone_number && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-gray-400" />
                                  <span>{restaurant.phone_number}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Menu Items Preview */}
                          <div className="mb-6">
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="font-semibold text-gray-900">Menu Highlights</h4>
                              {restaurant.menuItems.length > 2 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleRestaurantExpansion(restaurant.id)}
                                  className="text-sm"
                                >
                                  {expandedRestaurants.has(restaurant.id) ? "Show Less" : `+${restaurant.menuItems.length - 2} more`}
                                </Button>
                              )}
                            </div>
                            
                            {restaurant.menuItems.length > 0 ? (
                              <div className="space-y-3">
                                {restaurant.menuItems
                                  .slice(0, expandedRestaurants.has(restaurant.id) ? undefined : 2)
                                  .map((item) => (
                                  <div key={item.id} className="border border-gray-100 rounded-lg p-3 bg-gray-50/50">
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="font-medium text-gray-900">{item.name}</span>
                                          <div className="flex gap-1">
                                            {item.is_vegetarian && (
                                              <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-green-100 text-green-700">
                                                Veg
                                              </Badge>
                                            )}
                                            {item.is_vegan && (
                                              <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-green-100 text-green-700">
                                                Vegan
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                        {item.description && (
                                          <p className="text-gray-500 text-xs line-clamp-2">{item.description}</p>
                                        )}
                                      </div>
                                      <span className="font-bold text-green-600 ml-3">${item.price.toFixed(2)}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-400 italic text-center py-4">
                                Menu coming soon...
                              </p>
                            )}
                          </div>
                          
                          <div className="flex gap-3">
                            <Button 
                              onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                              variant="outline"
                              className="flex-1 border-gray-200 hover:bg-gray-50"
                            >
                              View Details
                            </Button>
                            <Button 
                              onClick={() => navigate(`/place-order/${restaurant.id}`)}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              disabled={restaurant.menuItems.length === 0}
                            >
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Order Now
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="max-w-md mx-auto">
                      <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                        <Search className="h-12 w-12 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No restaurants found</h3>
                      <p className="text-gray-500">Try adjusting your search criteria or browse all available restaurants</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setSearchTerm("")}
                      >
                        Clear Search
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ExploreRestaurants;
