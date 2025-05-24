
import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, ShoppingCart, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DB_TABLES } from "@/utils/dbUtils";
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

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

interface Restaurant {
  id: number;
  restaurant_name: string;
  address?: string;
  phone_number?: number;
  email?: string;
}

const PlaceOrder = () => {
  const { restaurantId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    // Check if user is logged in
    const userType = localStorage.getItem("foodieSync_userType");
    const userDataString = localStorage.getItem("foodieSync_userData");

    if (userType !== "user" || !userDataString) {
      toast({
        title: "Unauthorized",
        description: "Please login as a user to place orders",
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
      
      if (restaurantId) {
        fetchRestaurantData(parseInt(restaurantId));
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      navigate("/login");
    }
  }, [restaurantId, navigate, toast]);

  const fetchRestaurantData = async (id: number) => {
    try {
      setIsLoading(true);
      
      // Fetch restaurant details
      const { data: restaurantData, error: restaurantError } = await supabase
        .from(DB_TABLES.RESTAURANTS)
        .select("*")
        .eq("id", id)
        .single();
      
      if (restaurantError) throw restaurantError;
      setRestaurant(restaurantData);
      
      // Fetch menu items
      const { data: menuData, error: menuError } = await supabase
        .from("restaurant_menu_items")
        .select("*")
        .eq("restaurant_id", id)
        .eq("is_available", true);
      
      if (menuError) throw menuError;
      setMenuItems(menuData || []);
      
    } catch (error) {
      console.error("Error fetching restaurant data:", error);
      toast({
        title: "Error",
        description: "Failed to load restaurant data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = (menuItem: MenuItem) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.menuItem.id === menuItem.id);
      
      if (existingItem) {
        return prev.map(item => 
          item.menuItem.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { menuItem, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (menuItemId: string) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.menuItem.id === menuItemId);
      
      if (existingItem && existingItem.quantity > 1) {
        return prev.map(item => 
          item.menuItem.id === menuItemId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      } else {
        return prev.filter(item => item.menuItem.id !== menuItemId);
      }
    });
  };

  const getCartItemQuantity = (menuItemId: string) => {
    const item = cart.find(item => item.menuItem.id === menuItemId);
    return item ? item.quantity : 0;
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.menuItem.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart before checkout",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create order in database
      const orderData = {
        user_id: userData.id,
        restaurant_id: parseInt(restaurantId!),
        total_amount: getTotalPrice(),
        items: cart.map(item => ({
          menu_item_id: item.menuItem.id,
          name: item.menuItem.name,
          price: item.menuItem.price,
          quantity: item.quantity,
          total: item.menuItem.price * item.quantity
        })),
        status: 'completed'
      };

      const { data, error } = await supabase
        .from("user_orders")
        .insert(orderData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Order Placed Successfully!",
        description: `Your order of ${getTotalItems()} items has been placed for $${getTotalPrice().toFixed(2)}`,
      });

      // Clear cart and redirect
      setCart([]);
      setTimeout(() => {
        navigate("/user-dashboard");
      }, 2000);

    } catch (error) {
      console.error("Error placing order:", error);
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen bg-gray-50 w-full">
          <UserSidebar userName={userData?.name} />
          <div className="flex-1 p-6 md:p-10 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading restaurant menu...</p>
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-gray-50 w-full">
        <UserSidebar userName={userData?.name} />
        
        <div className="flex-1 p-6 md:p-10">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/explore-restaurants")}
              className="flex items-center gap-2 mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Restaurants
            </Button>
            
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {restaurant?.restaurant_name}
                </h1>
                <p className="text-gray-600">
                  {restaurant?.address}
                </p>
              </div>
              
              {cart.length > 0 && (
                <Card className="w-64">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Cart ({getTotalItems()} items)</span>
                      <ShoppingCart className="h-4 w-4" />
                    </div>
                    <div className="text-2xl font-bold text-green-600 mb-3">
                      ${getTotalPrice().toFixed(2)}
                    </div>
                    <Button onClick={handleCheckout} className="w-full">
                      Checkout
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {menuItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems.map((item) => (
                <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      <span className="text-xl font-bold text-green-600">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-600">{item.description}</p>
                    )}
                    <div className="flex gap-2">
                      {item.is_vegetarian && <Badge variant="secondary">Vegetarian</Badge>}
                      {item.is_vegan && <Badge variant="secondary">Vegan</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeFromCart(item.id)}
                          disabled={getCartItemQuantity(item.id) === 0}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="font-medium min-w-[20px] text-center">
                          {getCartItemQuantity(item.id)}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addToCart(item)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button
                        onClick={() => addToCart(item)}
                        className="ml-4"
                      >
                        Add to Cart
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center p-12 bg-white rounded-lg border">
              <p className="text-xl text-gray-500 mb-4">No menu items available</p>
              <p className="text-gray-400">This restaurant hasn't added any menu items yet</p>
            </div>
          )}
        </div>
      </div>
    </SidebarProvider>
  );
};

export default PlaceOrder;
