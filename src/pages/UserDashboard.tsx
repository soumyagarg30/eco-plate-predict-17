
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { DB_TABLES } from "@/utils/dbUtils";
import UserSidebar from "@/components/user/UserSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { ShoppingBag, Star, Calendar, TrendingUp, Clock, MapPin } from "lucide-react";

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

        // Combine orders with restaurant data and ensure items is an array
        const ordersWithRestaurants: Order[] = ordersData.map(order => ({
          ...order,
          items: Array.isArray(order.items) ? order.items : [],
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
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your dashboard...</p>
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
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Welcome back, {userData?.name}!
            </h1>
            <p className="text-lg text-gray-600">
              Ready to discover delicious food today?
            </p>
          </header>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-blue-500" onClick={handleExploreRestaurants}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Explore</h3>
                    <p className="text-sm text-gray-500">Discover restaurants</p>
                  </div>
                  <ShoppingBag className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-yellow-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{userStats.totalOrders}</h3>
                    <p className="text-sm text-gray-500">Total Orders</p>
                  </div>
                  <Star className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">${userStats.totalSpent.toFixed(2)}</h3>
                    <p className="text-sm text-gray-500">Total Spent</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">${userStats.avgOrderValue.toFixed(2)}</h3>
                    <p className="text-sm text-gray-500">Avg Order Value</p>
                  </div>
                  <Calendar className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Orders */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentOrders.length > 0 ? (
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{order.restaurant?.restaurant_name || "Unknown Restaurant"}</h4>
                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                              <MapPin className="h-3 w-3" />
                              <span>{order.restaurant?.address || "No address"}</span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {new Date(order.order_date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-xl font-bold text-green-600">${Number(order.total_amount).toFixed(2)}</span>
                            <p className="text-xs text-gray-500">{order.items.length} item(s)</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleViewOrder(order.id)} className="flex-1">
                            View Details
                          </Button>
                          <Button size="sm" onClick={() => handleReorderClick(order)} className="flex-1">
                            Reorder
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg text-gray-500 mb-2">No orders yet</p>
                    <p className="text-gray-400 mb-4">Start your food journey today!</p>
                    <Button onClick={handleExploreRestaurants}>
                      Explore Restaurants
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recommended Restaurants */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Recommended for You
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recommendedRestaurants.length > 0 ? (
                  <div className="space-y-4">
                    {recommendedRestaurants.map((restaurant) => (
                      <div key={restaurant.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                        <div className="mb-3">
                          <h4 className="font-semibold text-gray-900 mb-1">{restaurant.restaurant_name}</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <MapPin className="h-3 w-3" />
                            <span>{restaurant.address || "No address provided"}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleVisitRestaurant(restaurant.id)} className="flex-1">
                            View Menu
                          </Button>
                          <Button size="sm" onClick={() => navigate(`/restaurant/${restaurant.id}?tab=menu`)} className="flex-1">
                            Order Now
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg text-gray-500 mb-2">No restaurants available</p>
                    <p className="text-gray-400 mb-4">Check back later for recommendations</p>
                    <Button onClick={handleExploreRestaurants}>
                      Explore All Restaurants
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* User Journey Summary */}
          {userStats.totalOrders > 0 && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Your Food Journey</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="text-center p-6 bg-blue-50 rounded-lg">
                    <h3 className="text-3xl font-bold text-blue-600 mb-2">{userStats.totalOrders}</h3>
                    <p className="text-gray-700 font-medium">Orders Completed</p>
                    <p className="text-sm text-gray-500 mt-1">You're building quite the food history!</p>
                  </div>
                  <div className="text-center p-6 bg-green-50 rounded-lg">
                    <h3 className="text-3xl font-bold text-green-600 mb-2">${userStats.totalSpent.toFixed(2)}</h3>
                    <p className="text-gray-700 font-medium">Total Investment</p>
                    <p className="text-sm text-gray-500 mt-1">In delicious experiences</p>
                  </div>
                  <div className="text-center p-6 bg-purple-50 rounded-lg">
                    <h3 className="text-xl font-bold text-purple-600 mb-2">{userStats.favoriteRestaurant}</h3>
                    <p className="text-gray-700 font-medium">Favorite Restaurant</p>
                    <p className="text-sm text-gray-500 mt-1">Your go-to spot for great food</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </SidebarProvider>
  );
};

export default UserDashboard;
