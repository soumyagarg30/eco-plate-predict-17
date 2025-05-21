
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Star, MapPin, Clock, UtensilsCrossed, Search, Phone, Mail, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import UserNavbar from "@/components/user/UserNavbar";
import UserPreferencesForm from "@/components/user/UserPreferencesForm";
import RestaurantRatingForm from "@/components/user/RestaurantRatingForm";
import { supabase } from "@/integrations/supabase/client";

const UserDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userData, setUserData] = useState<any>(null);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openPreview, setOpenPreview] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("restaurants");
  const [openRatingDialog, setOpenRatingDialog] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  useEffect(() => {
    // Check if user is logged in
    const userType = localStorage.getItem("foodieSync_userType");
    const storedUserData = localStorage.getItem("foodieSync_userData");
    
    if (userType !== "user" || !storedUserData) {
      toast({
        title: "Access Denied",
        description: "Please log in as a user to access this page",
        variant: "destructive"
      });
      navigate("/login");
      return;
    }
    
    try {
      const parsedData = JSON.parse(storedUserData);
      setUserData(parsedData);
      
      // Fetch restaurants and user preferences
      fetchRestaurants();
      
      if (parsedData && parsedData.id) {
        fetchUserPreferences(parsedData.id);
        fetchUserRatings(parsedData.id);
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive"
      });
      navigate("/login");
    }
    
    setLoading(false);
  }, [navigate, toast, refreshTrigger]);

  const fetchRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from("Restaurants_Details")
        .select("*");
      
      if (error) throw error;
      
      if (data) {
        setRestaurants(data);
      }
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      toast({
        title: "Error",
        description: "Failed to load restaurants",
        variant: "destructive"
      });
    }
  };

  const fetchUserPreferences = async (userId: number) => {
    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setUserPreferences(data);
      }
    } catch (error) {
      console.error("Error fetching user preferences:", error);
    }
  };

  const fetchUserRatings = async (userId: number) => {
    try {
      const { data, error } = await supabase
        .from("restaurant_ratings")
        .select(`
          *,
          Restaurants_Details:restaurant_id (*)
        `)
        .eq("user_id", userId);
      
      if (error) throw error;
      
      if (data) {
        setRatings(data);
      }
    } catch (error) {
      console.error("Error fetching user ratings:", error);
    }
  };

  const handlePreview = (restaurant: any) => {
    setSelectedRestaurant(restaurant);
    setOpenPreview(true);
  };

  const handleContact = (restaurant: any) => {
    // Implement contact functionality here
    toast({
      title: "Contact Information",
      description: `You can contact ${restaurant.restaurant_name} at ${restaurant.phone_number} or ${restaurant.email}`,
    });
  };

  const handleRateRestaurant = () => {
    if (selectedRestaurant) {
      setOpenPreview(false);
      setOpenRatingDialog(true);
    }
  };

  const getUserRatingForRestaurant = (restaurantId: number) => {
    return ratings.find(rating => rating.restaurant_id === restaurantId);
  };

  const handlePreferencesUpdated = () => {
    // Refresh user preferences
    if (userData && userData.id) {
      fetchUserPreferences(userData.id);
    }
  };

  const handleRatingSuccess = () => {
    setOpenRatingDialog(false);
    setRefreshTrigger(prev => prev + 1);
    toast({
      title: "Rating submitted",
      description: "Thank you for your feedback!",
    });
  };

  const filteredRestaurants = searchQuery
    ? restaurants.filter(restaurant => 
        restaurant.restaurant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (restaurant.address && restaurant.address.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : restaurants;

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-lg">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <UserNavbar userName={userData?.Name || "User"} />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">
          Welcome back, {userData?.Name || "User"}
        </h1>
        
        <div className="flex gap-6">
          {/* Vertical Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-row gap-6 w-full" orientation="vertical">
            <Card className="border shadow h-fit">
              <CardContent className="p-0">
                <TabsList orientation="vertical" className="w-full bg-transparent rounded-md">
                  <TabsTrigger value="restaurants" orientation="vertical" className="flex items-center gap-2 px-4 py-3">
                    <UtensilsCrossed className="h-5 w-5" />
                    <span className="text-base">Restaurants</span>
                  </TabsTrigger>
                  <TabsTrigger value="ratings" orientation="vertical" className="flex items-center gap-2 px-4 py-3">
                    <Star className="h-5 w-5" />
                    <span className="text-base">My Ratings</span>
                  </TabsTrigger>
                  <TabsTrigger value="preferences" orientation="vertical" className="flex items-center gap-2 px-4 py-3">
                    <Settings className="h-5 w-5" />
                    <span className="text-base">My Preferences</span>
                  </TabsTrigger>
                </TabsList>
              </CardContent>
            </Card>

            {/* Tab Content */}
            <div className="flex-1">
              <TabsContent value="restaurants" className="m-0">
                <div className="mb-6">
                  <div className="relative mb-4">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search restaurants by name or location..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredRestaurants.map(restaurant => (
                    <Card key={restaurant.id} className="overflow-hidden h-full flex flex-col">
                      <div className="h-40 bg-gray-200 flex items-center justify-center overflow-hidden">
                        <img 
                          src={"/lovable-uploads/715acbd8-f10b-4c21-8814-7391636451e2.png"} 
                          alt={restaurant.restaurant_name} 
                          className="w-full h-full object-cover transition-transform hover:scale-105"
                        />
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex justify-between items-center">
                          <span>{restaurant.restaurant_name}</span>
                          {getUserRatingForRestaurant(restaurant.id) && (
                            <span className="flex items-center text-yellow-400">
                              <Star className="h-5 w-5 fill-yellow-400 mr-1" />
                              {getUserRatingForRestaurant(restaurant.id).rating}
                            </span>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pb-2 flex-grow">
                        {restaurant.address && (
                          <div className="flex items-center text-gray-500 mb-2">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span className="text-sm">{restaurant.address}</span>
                          </div>
                        )}
                        {restaurant.phone_number && (
                          <div className="flex items-center text-gray-500 mb-2">
                            <Phone className="h-4 w-4 mr-1" />
                            <span className="text-sm">{restaurant.phone_number}</span>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="pt-0 flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-1"
                          onClick={() => handlePreview(restaurant)}
                        >
                          View Details
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm"
                          className="flex-1"
                          onClick={() => handleContact(restaurant)}
                        >
                          Contact
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                  
                  {filteredRestaurants.length === 0 && (
                    <div className="col-span-full p-8 text-center text-gray-500 bg-gray-50 rounded-lg">
                      No restaurants found matching your search criteria.
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="ratings" className="m-0">
                <Card>
                  <CardHeader>
                    <CardTitle>My Restaurant Ratings</CardTitle>
                    <CardDescription>Review your past ratings and feedback</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {ratings.length > 0 ? (
                      <div className="border rounded-md overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Restaurant</TableHead>
                              <TableHead>Rating</TableHead>
                              <TableHead>Review</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {ratings.map((rating) => (
                              <TableRow key={rating.id}>
                                <TableCell className="font-medium">
                                  {rating.Restaurants_Details?.restaurant_name || "Unknown Restaurant"}
                                </TableCell>
                                <TableCell>
                                  <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-4 w-4 ${
                                          i < rating.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </TableCell>
                                <TableCell className="max-w-xs truncate">
                                  {rating.review || "No review provided"}
                                </TableCell>
                                <TableCell>
                                  {new Date(rating.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedRestaurant(rating.Restaurants_Details);
                                      setOpenRatingDialog(true);
                                    }}
                                  >
                                    Edit
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center p-6 bg-gray-50 rounded-md">
                        <p className="text-gray-500">You haven't rated any restaurants yet.</p>
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() => setActiveTab("restaurants")}
                        >
                          Browse Restaurants
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="preferences" className="m-0">
                <Card>
                  <CardHeader>
                    <CardTitle>My Preferences</CardTitle>
                    <CardDescription>Update your food preferences and settings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <UserPreferencesForm
                      userData={userData}
                      existingPreferences={userPreferences}
                      onSuccess={handlePreferencesUpdated}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
        
        {/* Restaurant Preview Dialog */}
        <Dialog open={openPreview} onOpenChange={setOpenPreview}>
          {selectedRestaurant && (
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle className="text-2xl flex justify-between items-center">
                  <span>{selectedRestaurant.restaurant_name}</span>
                  {getUserRatingForRestaurant(selectedRestaurant.id) && (
                    <span className="flex items-center text-yellow-400 text-lg">
                      <Star className="h-5 w-5 fill-yellow-400 mr-1" />
                      {getUserRatingForRestaurant(selectedRestaurant.id).rating}
                    </span>
                  )}
                </DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-md overflow-hidden">
                  <img 
                    src="/lovable-uploads/715acbd8-f10b-4c21-8814-7391636451e2.png" 
                    alt={selectedRestaurant.restaurant_name} 
                    className="w-full h-64 object-cover"
                  />
                </div>
                
                <div>
                  <Tabs defaultValue="info">
                    <TabsList className="mb-4">
                      <TabsTrigger value="info">Info</TabsTrigger>
                      <TabsTrigger value="contact">Contact</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="info">
                      <div className="space-y-4">
                        {selectedRestaurant.address && (
                          <div className="flex items-center text-gray-700">
                            <MapPin className="h-5 w-5 mr-2" />
                            <span>{selectedRestaurant.address}</span>
                          </div>
                        )}
                        
                        <div className="mt-4">
                          <p className="text-gray-600">
                            This restaurant is part of our FoodieSync network, working to reduce food waste and provide quality meals to those in need.
                          </p>
                        </div>
                        
                        {getUserRatingForRestaurant(selectedRestaurant.id) && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-md">
                            <p className="font-medium mb-2">Your Rating</p>
                            <div className="flex mb-2">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-5 w-5 ${
                                    i < getUserRatingForRestaurant(selectedRestaurant.id).rating 
                                      ? "text-yellow-400 fill-yellow-400" 
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            {getUserRatingForRestaurant(selectedRestaurant.id).review && (
                              <p className="text-gray-600 italic">
                                "{getUserRatingForRestaurant(selectedRestaurant.id).review}"
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="contact">
                      <div className="space-y-4">
                        {selectedRestaurant.phone_number && (
                          <div className="flex items-center text-gray-700">
                            <Phone className="h-5 w-5 mr-2" />
                            <span>{selectedRestaurant.phone_number}</span>
                          </div>
                        )}
                        
                        {selectedRestaurant.email && (
                          <div className="flex items-center text-gray-700">
                            <Mail className="h-5 w-5 mr-2" />
                            <span>{selectedRestaurant.email}</span>
                          </div>
                        )}
                        
                        <div className="mt-4">
                          <p className="text-gray-600">
                            Contact this restaurant directly to inquire about their food availability or to arrange pickup/delivery.
                          </p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => handleContact(selectedRestaurant)}>
                  Contact
                </Button>
                <Button onClick={handleRateRestaurant}>
                  {getUserRatingForRestaurant(selectedRestaurant.id) ? "Update Rating" : "Rate Restaurant"}
                </Button>
              </div>
            </DialogContent>
          )}
        </Dialog>
        
        {/* Rating Dialog */}
        <Dialog open={openRatingDialog} onOpenChange={setOpenRatingDialog}>
          {selectedRestaurant && (
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {getUserRatingForRestaurant(selectedRestaurant.id) 
                    ? "Update your rating" 
                    : "Rate this restaurant"}
                </DialogTitle>
              </DialogHeader>
              
              <RestaurantRatingForm
                userData={userData}
                restaurant={selectedRestaurant}
                existingRating={getUserRatingForRestaurant(selectedRestaurant.id)}
                onSuccess={handleRatingSuccess}
              />
            </DialogContent>
          )}
        </Dialog>
      </main>
      
      <Footer />
    </div>
  );
};

export default UserDashboard;
