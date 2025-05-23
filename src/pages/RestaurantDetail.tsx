
import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { DB_TABLES, RestaurantDetails } from "@/utils/dbUtils";
import UserSidebar from "@/components/user/UserSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import RestaurantRatingForm from "@/components/user/RestaurantRatingForm";
import { Star } from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_vegetarian: boolean | null;
  is_vegan: boolean | null;
}

interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
}

const RestaurantDetail = () => {
  const { id } = useParams<{ id: string }>();
  const restaurantId = parseInt(id || "0");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [restaurant, setRestaurant] = useState<RestaurantDetails | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [userRating, setUserRating] = useState<any>(null);
  const [tab, setTab] = useState(searchParams.get("tab") || "menu");

  useEffect(() => {
    // Check if user is logged in
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
      
      // Fetch restaurant details and menu items
      fetchRestaurantDetails();
      fetchMenuItems();
      fetchUserRating(parsedData.id);
    } catch (error) {
      console.error("Error parsing user data:", error);
      toast({
        title: "Error",
        description: "Invalid user data. Please login again.",
        variant: "destructive",
      });
      
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    }
  }, [id, navigate, toast]);

  const fetchRestaurantDetails = async () => {
    try {
      setIsLoading(true);
      if (!restaurantId) return;

      const { data, error } = await supabase
        .from(DB_TABLES.RESTAURANTS)
        .select("*")
        .eq("id", restaurantId)
        .single();
      
      if (error) {
        console.error("Error fetching restaurant details:", error);
        throw error;
      }
      
      if (data) {
        setRestaurant(data as RestaurantDetails);
      }
    } catch (error) {
      console.error("Error fetching restaurant details:", error);
      toast({
        title: "Error",
        description: "Failed to load restaurant details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      if (!restaurantId) return;

      const { data, error } = await supabase
        .from("restaurant_menu_items")
        .select("id, name, description, price, is_vegetarian, is_vegan")
        .eq("restaurant_id", restaurantId)
        .eq("is_available", true);
      
      if (error) {
        console.error("Error fetching menu items:", error);
        throw error;
      }
      
      if (data) {
        setMenuItems(data as MenuItem[]);
      }
    } catch (error) {
      console.error("Error fetching menu items:", error);
      toast({
        title: "Error",
        description: "Failed to load menu items",
        variant: "destructive",
      });
    }
  };

  const fetchUserRating = async (userId: number) => {
    try {
      const { data, error } = await supabase
        .from(DB_TABLES.RESTAURANT_RATINGS)
        .select("*")
        .eq("restaurant_id", restaurantId)
        .eq("user_id", userId)
        .single();
      
      if (!error && data) {
        setUserRating(data);
      }
    } catch (error) {
      // It's okay if the user hasn't rated this restaurant yet
      console.log("No previous rating found");
    }
  };

  const addToOrder = (menuItem: MenuItem) => {
    setOrderItems(prev => {
      // Check if the item is already in the order
      const existingItem = prev.find(item => item.menuItem.id === menuItem.id);
      
      if (existingItem) {
        // Increase quantity if already in order
        return prev.map(item => 
          item.menuItem.id === menuItem.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        // Add new item to order
        return [...prev, { menuItem, quantity: 1 }];
      }
    });

    toast({
      title: "Added to Order",
      description: `${menuItem.name} added to your order`,
    });
  };

  const updateQuantity = (menuItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      // Remove item if quantity is zero or negative
      setOrderItems(prev => prev.filter(item => item.menuItem.id !== menuItemId));
    } else {
      // Update quantity
      setOrderItems(prev => 
        prev.map(item => 
          item.menuItem.id === menuItemId
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    }
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => {
      return total + (item.menuItem.price * item.quantity);
    }, 0);
  };

  const placeOrder = async () => {
    try {
      setIsPlacingOrder(true);

      if (!userData?.id || !restaurant?.id || orderItems.length === 0) {
        toast({
          title: "Error",
          description: "Cannot place order with missing information",
          variant: "destructive",
        });
        return;
      }

      // Prepare order items for JSON storage
      const orderItemsJson = orderItems.map(item => ({
        menu_item_id: item.menuItem.id,
        menu_item_name: item.menuItem.name,
        price_per_unit: item.menuItem.price,
        quantity: item.quantity,
        total_price: item.menuItem.price * item.quantity
      }));

      // Calculate total order amount
      const totalAmount = calculateTotal();

      // Insert the order into the user_orders table
      const { data: orderData, error: orderError } = await supabase
        .from("user_orders")
        .insert({
          user_id: userData.id,
          restaurant_id: restaurant.id,
          items: orderItemsJson,
          total_amount: totalAmount,
          status: "completed"
        })
        .select()
        .single();

      if (orderError) {
        console.error("Error placing order:", orderError);
        throw orderError;
      }

      // Clear the order items
      setOrderItems([]);
      
      toast({
        title: "Order Placed!",
        description: "Your order has been successfully placed",
      });

      // Switch to the rate tab
      setTab("rate");

    } catch (error) {
      console.error("Error placing order:", error);
      toast({
        title: "Error",
        description: "Failed to place your order",
        variant: "destructive",
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleRatingSuccess = () => {
    toast({
      title: "Thank you!",
      description: "Your rating has been submitted",
    });
    // Refresh user rating
    if (userData?.id) {
      fetchUserRating(userData.id);
    }
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen bg-gray-50 w-full">
          <UserSidebar userName={userData?.name} />
          <div className="flex-1 p-6 md:p-10 flex items-center justify-center">
            <p>Loading restaurant details...</p>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (!restaurant) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen bg-gray-50 w-full">
          <UserSidebar userName={userData?.name} />
          <div className="flex-1 p-6 md:p-10 flex flex-col items-center justify-center">
            <h2 className="text-xl font-semibold mb-4">Restaurant not found</h2>
            <Button onClick={() => navigate("/explore-restaurants")}>
              Back to Restaurants
            </Button>
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
          <Button 
            variant="outline" 
            onClick={() => navigate("/explore-restaurants")} 
            className="mb-6"
          >
            &larr; Back to Restaurants
          </Button>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">{restaurant.restaurant_name}</CardTitle>
              <CardDescription>
                <div className="flex flex-col gap-1">
                  <p>{restaurant.address || "No address provided"}</p>
                  <p>{restaurant.phone_number ? `Phone: ${restaurant.phone_number}` : "No phone provided"}</p>
                  <p>{restaurant.email || "No email provided"}</p>
                </div>
              </CardDescription>
            </CardHeader>
          </Card>

          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="menu">Menu & Order</TabsTrigger>
              <TabsTrigger value="rate">Rate & Review</TabsTrigger>
            </TabsList>

            <TabsContent value="menu" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <h2 className="text-xl font-semibold mb-4">Menu Items</h2>
                  
                  {menuItems.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {menuItems.map((menuItem) => (
                        <Card key={menuItem.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between">
                              <div>
                                <h3 className="font-medium">{menuItem.name}</h3>
                                <p className="text-sm text-gray-500">{menuItem.description || "No description"}</p>
                                <p className="text-sm mt-1">
                                  {menuItem.is_vegetarian && <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded mr-1">Veg</span>}
                                  {menuItem.is_vegan && <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded mr-1">Vegan</span>}
                                </p>
                                <p className="font-medium mt-2">${menuItem.price.toFixed(2)}</p>
                              </div>
                              <Button size="sm" onClick={() => addToOrder(menuItem)}>Add</Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No menu items available</p>
                  )}
                </div>

                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Your Order</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {orderItems.length > 0 ? (
                        <div className="space-y-4">
                          {orderItems.map((orderItem) => (
                            <div key={orderItem.menuItem.id} className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">{orderItem.menuItem.name}</p>
                                <p className="text-sm text-gray-500">
                                  ${orderItem.menuItem.price.toFixed(2)} × {orderItem.quantity}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => updateQuantity(orderItem.menuItem.id, orderItem.quantity - 1)}
                                >
                                  -
                                </Button>
                                <span>{orderItem.quantity}</span>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => updateQuantity(orderItem.menuItem.id, orderItem.quantity + 1)}
                                >
                                  +
                                </Button>
                              </div>
                            </div>
                          ))}
                          
                          <div className="pt-4 border-t">
                            <div className="flex justify-between font-medium">
                              <span>Total:</span>
                              <span>${calculateTotal().toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500">No items in your order</p>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full" 
                        disabled={orderItems.length === 0 || isPlacingOrder}
                        onClick={placeOrder}
                      >
                        {isPlacingOrder ? "Placing Order..." : "Place Order"}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="rate" className="mt-6">
              <div className="max-w-lg mx-auto">
                <Card>
                  <CardHeader>
                    <CardTitle>Rate & Review</CardTitle>
                    <CardDescription>
                      Share your experience at {restaurant.restaurant_name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RestaurantRatingForm 
                      userData={userData} 
                      restaurant={restaurant} 
                      onSuccess={handleRatingSuccess}
                      existingRating={userRating}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default RestaurantDetail;
