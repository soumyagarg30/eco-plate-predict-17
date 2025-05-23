
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Plus, ShoppingCart } from "lucide-react";
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

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  restaurantId: number;
  restaurantName: string;
}

const ExploreRestaurants = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [restaurants, setRestaurants] = useState<RestaurantWithMenu[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
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

  const addToCart = (menuItem: MenuItem, restaurant: RestaurantWithMenu) => {
    setCart(prev => {
      const existingItem = prev.find(item => 
        item.menuItem.id === menuItem.id && item.restaurantId === restaurant.id
      );
      
      if (existingItem) {
        return prev.map(item => 
          item.menuItem.id === menuItem.id && item.restaurantId === restaurant.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, {
          menuItem,
          quantity: 1,
          restaurantId: restaurant.id,
          restaurantName: restaurant.restaurant_name
        }];
      }
    });

    toast({
      title: "Added to Cart",
      description: `${menuItem.name} added from ${restaurant.restaurant_name}`,
    });
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

  const getTotalCartItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const proceedToCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart before checkout",
        variant: "destructive",
      });
      return;
    }

    // Group cart items by restaurant for checkout
    const restaurantGroups = cart.reduce((groups, item) => {
      if (!groups[item.restaurantId]) {
        groups[item.restaurantId] = {
          restaurant: { id: item.restaurantId, name: item.restaurantName },
          items: []
        };
      }
      groups[item.restaurantId].items.push(item);
      return groups;
    }, {} as Record<number, any>);

    // For now, navigate to the first restaurant's detail page with the cart items
    const firstRestaurantId = Object.keys(restaurantGroups)[0];
    navigate(`/restaurant/${firstRestaurantId}?tab=menu`);
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
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Explore Restaurants
              </h1>
              <p className="text-gray-600">
                Discover restaurants and place orders
              </p>
            </div>
            
            {getTotalCartItems() > 0 && (
              <Button onClick={proceedToCheckout} className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Cart ({getTotalCartItems()})
              </Button>
            )}
          </div>

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
                    <Card key={restaurant.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{restaurant.restaurant_name}</CardTitle>
                        <div className="text-sm text-gray-500">
                          <p>{restaurant.address || "No address provided"}</p>
                          {restaurant.phone_number && (
                            <p>Phone: {restaurant.phone_number}</p>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pb-4">
                        {/* Menu Items */}
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium text-sm">Menu Items</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRestaurantExpansion(restaurant.id)}
                            >
                              {expandedRestaurants.has(restaurant.id) ? "Show Less" : "Show More"}
                            </Button>
                          </div>
                          
                          {restaurant.menuItems.length > 0 ? (
                            <div className="space-y-2">
                              {restaurant.menuItems
                                .slice(0, expandedRestaurants.has(restaurant.id) ? undefined : 3)
                                .map((item) => (
                                <div key={item.id} className="border rounded-lg p-3 bg-white">
                                  <div className="flex justify-between items-start mb-1">
                                    <div className="flex-1">
                                      <span className="font-medium text-sm">{item.name}</span>
                                      {item.description && (
                                        <p className="text-gray-500 text-xs mt-1 line-clamp-2">{item.description}</p>
                                      )}
                                      <div className="flex gap-1 mt-2">
                                        {item.is_vegetarian && <Badge variant="secondary" className="text-xs">Veg</Badge>}
                                        {item.is_vegan && <Badge variant="secondary" className="text-xs">Vegan</Badge>}
                                      </div>
                                    </div>
                                    <div className="text-right ml-2">
                                      <span className="font-bold text-sm">${item.price.toFixed(2)}</span>
                                      <Button
                                        size="sm"
                                        className="ml-2 h-6 w-6 p-0"
                                        onClick={() => addToCart(item, restaurant)}
                                      >
                                        <Plus className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {!expandedRestaurants.has(restaurant.id) && restaurant.menuItems.length > 3 && (
                                <p className="text-xs text-gray-400 italic text-center">
                                  + {restaurant.menuItems.length - 3} more items available
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400">No menu items available</p>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                            variant="outline"
                            className="flex-1"
                          >
                            View Details
                          </Button>
                          <Button 
                            onClick={() => navigate(`/restaurant/${restaurant.id}?tab=menu`)}
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
                <div className="text-center p-12 bg-white rounded-lg border">
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
