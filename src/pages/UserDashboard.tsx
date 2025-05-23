
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { DB_TABLES } from "@/utils/dbUtils";
import UserSidebar from "@/components/user/UserSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { ShoppingBag, Star, Calendar, TrendingUp } from "lucide-react";

interface Restaurant {
  id: number;
  restaurant_name: string;
  address?: string;
}

interface Order {
  id: string;
  restaurant_id: number;
  total_amount: number;
  order_date: string;
  status: string;
  items: any[];
  restaurant?: Restaurant;
}

interface UserStats {
  totalOrders: number;
  totalSpent: number;
  avgOrderValue: number;
  favoriteRestaurant: string;
}

const UserDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userData, setUserData] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    totalOrders: 0,
    totalSpent: 0,
    avgOrderValue: 0,
    favoriteRestaurant: "None"
  });
  const [recommendedRestaurants, setRecommendedRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      
      fetchUserDashboardData(parsedData.id);
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
  }, [navigate, toast]);

  const fetchUserDashboardData = async (userId: number) => {
    try {
      setIsLoading(true);
      
      // Fetch recent orders
      const { data: ordersData, error: ordersError } = await supabase
        .from("user_orders")
        .select("*")
        .eq("user_id", userId)
        .order("order_date", { ascending: false })
        .limit(5);

      if (ordersError) throw ordersError;

      if (ordersData && ordersData.length > 0) {
        // Fetch restaurant details for orders
        const restaurantIds = [...new Set(ordersData.map(order => order.restaurant_id))];
        const { data: restaurantsData, error: restaurantsError } = await supabase
          .from(DB_TABLES.RESTAURANTS)
          .select("id, restaurant_name, address")
          .in("id", restaurantIds);

        if (restaurantsError) throw restaurantsError;

        // Combine orders with restaurant data
        const ordersWithRestaurants = ordersData.map(order => ({
          ...order,
          restaurant: restaurantsData?.find(r => r.id === order.restaurant_id)
        }));

        setRecentOrders(ordersWithRestaurants);

        // Calculate user stats
        const totalOrders = ordersData.length;
        const totalSpent = ordersData.reduce((sum, order) => sum + Number(order.total_amount), 0);
        const avgOrderValue = totalSpent / totalOrders;

        // Find most frequent restaurant
        const restaurantCounts = ordersData.reduce((acc, order) => {
          acc[order.restaurant_id] = (acc[order.restaurant_id] || 0) + 1;
          return acc;
        }, {} as Record<number, number>);

        const mostFrequentRestaurantId = Object.entries(restaurantCounts).reduce((a, b) => 
          restaurantCounts[Number(a[0])] > restaurantCounts[Number(b[0])] ? a : b
        )[0];

        const favoriteRestaurant = restaurantsData?.find(r => r.id === Number(mostFrequentRestaurantId))?.restaurant_name || "None";

        setUserStats({
          totalOrders,
          totalSpent,
          avgOrderValue,
          favoriteRestaurant
        });
      }

      // Fetch recommended restaurants (all restaurants for now)
      const { data: allRestaurants, error: restaurantsError } = await supabase
        .from(DB_TABLES.RESTAURANTS)
        .select("id, restaurant_name, address")
        .limit(3);

      if (restaurantsError) throw restaurantsError;

      if (allRestaurants) {
        setRecommendedRestaurants(allRestaurants);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExploreRestaurants = () => {
    navigate("/explore-restaurants");
  };

  const handleViewOrder = (orderId: string) => {
    // Navigate to order details or show order details modal
    console.log("View order:", orderId);
    toast({
      title: "Order Details",
      description: `Viewing details for order ${orderId}`,
    });
  };

  const handleReorderClick = async (order: Order) => {
    if (order.restaurant?.id) {
      navigate(`/restaurant/${order.restaurant.id}?tab=menu`);
    }
  };

  const handleVisitRestaurant = (restaurantId: number) => {
    navigate(`/restaurant/${restaurantId}`);
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen bg-gray-50 w-full">
          <UserSidebar userName={userData?.name} />
          <div className="flex-1 p-6 md:p-10 flex items-center justify-center">
            <p>Loading dashboard...</p>
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
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {userData?.name}!
            </h1>
            <p className="text-gray-600">
              Here's your personalized food ordering experience
            </p>
          </header>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleExploreRestaurants}>
              <CardContent className="p-4 text-center">
                <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <h3 className="font-medium">Explore Restaurants</h3>
                <p className="text-sm text-gray-500">Discover new places</p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center">
                <Star className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <h3 className="font-medium">Total Orders</h3>
                <p className="text-2xl font-bold">{userStats.totalOrders}</p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <h3 className="font-medium">Total Spent</h3>
                <p className="text-2xl font-bold">${userStats.totalSpent.toFixed(2)}</p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <h3 className="font-medium">Avg Order</h3>
                <p className="text-2xl font-bold">${userStats.avgOrderValue.toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {recentOrders.length > 0 ? (
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">{order.restaurant?.restaurant_name || "Unknown Restaurant"}</h4>
                            <p className="text-sm text-gray-500">
                              {new Date(order.order_date).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="text-lg font-bold">${Number(order.total_amount).toFixed(2)}</span>
                        </div>
                        <div className="text-sm text-gray-600 mb-3">
                          {order.items.length} item(s) • Status: {order.status}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleViewOrder(order.id)}>
                            View Details
                          </Button>
                          <Button size="sm" onClick={() => handleReorderClick(order)}>
                            Reorder
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No orders yet</p>
                    <Button onClick={handleExploreRestaurants}>
                      Start Ordering
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recommended Restaurants */}
            <Card>
              <CardHeader>
                <CardTitle>Recommended Restaurants</CardTitle>
              </CardHeader>
              <CardContent>
                {recommendedRestaurants.length > 0 ? (
                  <div className="space-y-4">
                    {recommendedRestaurants.map((restaurant) => (
                      <div key={restaurant.id} className="border rounded-lg p-4">
                        <h4 className="font-medium mb-1">{restaurant.restaurant_name}</h4>
                        <p className="text-sm text-gray-500 mb-3">{restaurant.address || "No address provided"}</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleVisitRestaurant(restaurant.id)}>
                            View Menu
                          </Button>
                          <Button size="sm" onClick={() => navigate(`/restaurant/${restaurant.id}?tab=menu`)}>
                            Order Now
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No restaurants available</p>
                    <Button onClick={handleExploreRestaurants}>
                      Explore Restaurants
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* User Stats */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Your Food Journey</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-blue-600">{userStats.totalOrders}</h3>
                  <p className="text-gray-600">Total Orders Placed</p>
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-green-600">${userStats.totalSpent.toFixed(2)}</h3>
                  <p className="text-gray-600">Total Amount Spent</p>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-purple-600">{userStats.favoriteRestaurant}</h3>
                  <p className="text-gray-600">Favorite Restaurant</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default UserDashboard;
