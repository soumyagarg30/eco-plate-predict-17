
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import { Star, MapPin, Clock, UtensilsCrossed } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import UserNavbar from "@/components/user/UserNavbar";

const UserDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openPreview, setOpenPreview] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  
  // Mock data for restaurants
  const restaurants = [
    {
      id: 1,
      name: "Green Garden Restaurant",
      rating: 4.8,
      cuisine: "Vegetarian & Vegan",
      location: "123 Healthy St, Foodville",
      openingHours: "9:00 AM - 10:00 PM",
      description: "Farm-to-table restaurant with organic produce and sustainable practices.",
      image: "/lovable-uploads/715acbd8-f10b-4c21-8814-7391636451e2.png"
    },
    {
      id: 2,
      name: "Spice Palace",
      rating: 4.6,
      cuisine: "Indian & Asian Fusion",
      location: "456 Flavor Ave, Tastetown",
      openingHours: "11:00 AM - 11:00 PM",
      description: "Authentic spices and flavors from across Asia with modern cooking techniques.",
      image: "/lovable-uploads/0d94d838-2efe-4a27-acef-26b614159348.png"
    },
    {
      id: 3,
      name: "Ocean Delights",
      rating: 4.5,
      cuisine: "Seafood",
      location: "789 Coastal Rd, Bayview",
      openingHours: "12:00 PM - 10:00 PM",
      description: "Fresh seafood sourced daily from local fishermen with ocean view dining.",
      image: "/lovable-uploads/715acbd8-f10b-4c21-8814-7391636451e2.png"
    }
  ];

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
  }, [navigate, toast]);

  const handlePreview = (restaurant: any) => {
    setSelectedRestaurant(restaurant);
    setOpenPreview(true);
  };

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
        <h1 className="text-3xl font-bold text-foodie-green-dark mb-8">
          Welcome back, {userData?.Name || "User"}
        </h1>
        
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-foodie-green-dark mb-4">
            Recommended Restaurants
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map(restaurant => (
              <Card key={restaurant.id} className="overflow-hidden">
                <div className="h-48 overflow-hidden">
                  <img 
                    src={restaurant.image} 
                    alt={restaurant.name} 
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                  />
                </div>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>{restaurant.name}</span>
                    <span className="flex items-center text-foodie-yellow">
                      <Star className="h-5 w-5 fill-foodie-yellow mr-1" />
                      {restaurant.rating}
                    </span>
                  </CardTitle>
                  <CardDescription>{restaurant.cuisine}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-gray-500 mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm">{restaurant.location}</span>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    <span className="text-sm">{restaurant.openingHours}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full border-foodie-yellow text-foodie-yellow hover:bg-foodie-yellow hover:text-white"
                    onClick={() => handlePreview(restaurant)}
                  >
                    Preview
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        {/* Restaurant Preview Dialog */}
        <Dialog open={openPreview} onOpenChange={setOpenPreview}>
          {selectedRestaurant && (
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle className="text-2xl text-foodie-green-dark flex justify-between items-center">
                  <span>{selectedRestaurant.name}</span>
                  <span className="flex items-center text-foodie-yellow text-lg">
                    <Star className="h-5 w-5 fill-foodie-yellow mr-1" />
                    {selectedRestaurant.rating}
                  </span>
                </DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-md overflow-hidden">
                  <img 
                    src={selectedRestaurant.image} 
                    alt={selectedRestaurant.name} 
                    className="w-full h-64 object-cover"
                  />
                </div>
                
                <div>
                  <Tabs defaultValue="info">
                    <TabsList className="mb-4">
                      <TabsTrigger value="info">Info</TabsTrigger>
                      <TabsTrigger value="menu">Menu</TabsTrigger>
                      <TabsTrigger value="reviews">Reviews</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="info">
                      <div className="space-y-4">
                        <div className="flex items-center text-gray-700">
                          <UtensilsCrossed className="h-5 w-5 mr-2 text-foodie-green" />
                          <span>{selectedRestaurant.cuisine}</span>
                        </div>
                        
                        <div className="flex items-center text-gray-700">
                          <MapPin className="h-5 w-5 mr-2 text-foodie-green" />
                          <span>{selectedRestaurant.location}</span>
                        </div>
                        
                        <div className="flex items-center text-gray-700">
                          <Clock className="h-5 w-5 mr-2 text-foodie-green" />
                          <span>{selectedRestaurant.openingHours}</span>
                        </div>
                        
                        <div className="mt-4">
                          <p className="text-gray-600">{selectedRestaurant.description}</p>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="menu">
                      <p className="text-gray-600">Sample menu items will be displayed here.</p>
                    </TabsContent>
                    
                    <TabsContent value="reviews">
                      <div className="space-y-4">
                        <div className="border-b pb-3">
                          <div className="flex items-center mb-2">
                            <Avatar className="h-8 w-8 mr-2">
                              <div className="bg-foodie-green text-white w-full h-full flex items-center justify-center">
                                J
                              </div>
                            </Avatar>
                            <span className="font-medium">John D.</span>
                            <span className="ml-auto flex items-center text-foodie-yellow">
                              <Star className="h-4 w-4 fill-foodie-yellow mr-1" />
                              4.8
                            </span>
                          </div>
                          <p className="text-gray-600">
                            Amazing food and great service! Will definitely come back.
                          </p>
                        </div>
                        
                        <div>
                          <div className="flex items-center mb-2">
                            <Avatar className="h-8 w-8 mr-2">
                              <div className="bg-foodie-yellow text-white w-full h-full flex items-center justify-center">
                                S
                              </div>
                            </Avatar>
                            <span className="font-medium">Sarah M.</span>
                            <span className="ml-auto flex items-center text-foodie-yellow">
                              <Star className="h-4 w-4 fill-foodie-yellow mr-1" />
                              4.5
                            </span>
                          </div>
                          <p className="text-gray-600">
                            Great atmosphere and delicious food. A bit pricey but worth it.
                          </p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline">Save</Button>
                <Button className="bg-foodie-green hover:bg-foodie-green-dark">Book a Table</Button>
              </div>
            </DialogContent>
          )}
        </Dialog>
      </main>
      
      <Footer />
    </div>
  );
};

export default UserDashboard;
