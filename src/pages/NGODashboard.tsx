
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LogOut, Search, User, Building, ClipboardList, Settings } from "lucide-react";

// Define form schema for restaurant request
const requestFormSchema = z.object({
  requestTitle: z.string().min(5, "Title must be at least 5 characters"),
  quantity: z.string().min(1, "Quantity is required").refine(val => !isNaN(Number(val)), {
    message: "Quantity must be a number",
  }),
  dueDate: z.string().min(1, "Due date is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  restaurantId: z.number().optional(),
});

type RequestFormValues = z.infer<typeof requestFormSchema>;

const NGODashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userData, setUserData] = useState<any>(null);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      requestTitle: "",
      quantity: "",
      dueDate: "",
      description: "",
    },
  });

  useEffect(() => {
    const userType = localStorage.getItem("foodieSync_userType");
    const userDataString = localStorage.getItem("foodieSync_userData");
    
    if (!userType || userType !== "ngo" || !userDataString) {
      navigate("/login");
      return;
    }
    
    try {
      const parsedData = JSON.parse(userDataString);
      setUserData(parsedData);
      
      // Fetch restaurants
      fetchRestaurants();
      
      // Fetch pending requests for this NGO
      if (parsedData && parsedData.id) {
        fetchPendingRequests(parsedData.id);
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      navigate("/login");
    }
  }, [navigate]);

  const fetchRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from("Restaurants_Details")
        .select("*");
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setRestaurants(data);
      }
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      toast({
        title: "Error",
        description: "Failed to load restaurants",
        variant: "destructive",
      });
    }
  };

  const fetchPendingRequests = async (ngoId: number) => {
    try {
      const { data, error } = await supabase
        .from("packing_requests")
        .select("*")
        .eq("requester_id", ngoId)
        .eq("requester_type", "ngo");
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setPendingRequests(data);
      }
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      toast({
        title: "Error",
        description: "Failed to load pending requests",
        variant: "destructive",
      });
    }
  };

  const handleRestaurantSelect = (restaurant: any) => {
    setSelectedRestaurant(restaurant);
    form.setValue("restaurantId", restaurant.id);
  };

  const handleLogout = () => {
    localStorage.removeItem("foodieSync_userType");
    localStorage.removeItem("foodieSync_userData");
    toast({
      title: "Success",
      description: "You have been logged out successfully",
    });
    navigate("/login");
  };

  const filteredRestaurants = searchQuery
    ? restaurants.filter(restaurant => 
        restaurant.restaurant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (restaurant.address && restaurant.address.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : restaurants;

  const onSubmitRequest = async (data: RequestFormValues) => {
    if (!userData) {
      toast({
        title: "Error",
        description: "User data not found",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("packing_requests")
        .insert({
          request_title: data.requestTitle,
          quantity: parseInt(data.quantity),
          due_date: data.dueDate,
          request_description: data.description,
          requester_id: userData.id,
          requester_type: "ngo",
          packing_company_id: data.restaurantId,
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Food request submitted successfully",
      });

      form.reset();
      setSelectedRestaurant(null);
      fetchPendingRequests(userData.id);
    } catch (error) {
      console.error("Error submitting request:", error);
      toast({
        title: "Error",
        description: "Failed to submit request",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Welcome, {userData?.name}</h2>
          <p className="text-gray-600 mt-1">
            Manage your organization profile and food requests
          </p>
        </div>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full md:w-[500px] grid-cols-3 mb-8 bg-gray-100 p-1 rounded-lg">
            <TabsTrigger value="profile" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="food-requests" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <ClipboardList className="h-4 w-4 mr-2" />
              Food Requests
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="mt-6">
            <Card className="border-none shadow-md">
              <CardHeader className="bg-blue-50 border-b pb-8 pt-8">
                <CardTitle className="text-2xl font-bold text-blue-800">Organization Profile</CardTitle>
                <CardDescription className="text-blue-600">
                  View and manage your organization details
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-8">
                {userData && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-1">
                        <h3 className="text-sm font-medium text-gray-500">Organization Name</h3>
                        <p className="text-xl font-semibold text-gray-800">{userData.name}</p>
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-medium text-gray-500">Email Address</h3>
                        <p className="text-xl text-gray-800">{userData.email}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {userData.phone_number && (
                        <div className="space-y-1">
                          <h3 className="text-sm font-medium text-gray-500">Phone Number</h3>
                          <p className="text-xl text-gray-800">{userData.phone_number}</p>
                        </div>
                      )}
                      
                      {userData.address && (
                        <div className="space-y-1">
                          <h3 className="text-sm font-medium text-gray-500">Address</h3>
                          <p className="text-xl text-gray-800">{userData.address}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="bg-gray-50 py-4 flex justify-end border-t">
                <Button variant="outline" className="mr-2">Edit Profile</Button>
                <Button>Update Password</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="food-requests" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-none shadow-md h-full">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <span className="text-green-600 mr-2">●</span>
                    New Food Request
                  </CardTitle>
                  <CardDescription>Request food from partner restaurants</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <div className="relative mb-4">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search restaurants by name or location..."
                        className="pl-8 border-gray-300"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    
                    <div className="border rounded-md h-48 overflow-y-auto shadow-inner">
                      {filteredRestaurants.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Address</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredRestaurants.map((restaurant) => (
                              <TableRow 
                                key={restaurant.id}
                                className={selectedRestaurant?.id === restaurant.id ? "bg-blue-50" : ""}
                              >
                                <TableCell className="font-medium">{restaurant.restaurant_name}</TableCell>
                                <TableCell>{restaurant.address || "N/A"}</TableCell>
                                <TableCell>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleRestaurantSelect(restaurant)}
                                    className="hover:bg-blue-100"
                                  >
                                    Select
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          No restaurants found
                        </div>
                      )}
                    </div>
                    
                    {selectedRestaurant && (
                      <div className="mt-4 p-3 border rounded-md bg-blue-50 text-blue-800 border-blue-200">
                        <p className="font-medium">Selected: {selectedRestaurant.restaurant_name}</p>
                      </div>
                    )}
                  </div>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmitRequest)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="requestTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Request Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Food Request Title" className="border-gray-300" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="quantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantity (servings)</FormLabel>
                              <FormControl>
                                <Input type="number" min="1" placeholder="Number of servings" className="border-gray-300" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="dueDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Needed By</FormLabel>
                              <FormControl>
                                <Input type="date" className="border-gray-300" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe your specific requirements, dietary restrictions, etc." 
                                className="min-h-24 border-gray-300"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={isLoading || !selectedRestaurant}
                      >
                        {isLoading ? "Submitting..." : "Submit Request"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
              
              <Card className="border-none shadow-md h-full">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <span className="text-amber-500 mr-2">●</span>
                    Pending Requests
                  </CardTitle>
                  <CardDescription>Track the status of your food requests</CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingRequests.length > 0 ? (
                    <div className="border rounded-md overflow-x-auto shadow-inner">
                      <Table>
                        <TableHeader className="bg-gray-50">
                          <TableRow>
                            <TableHead>Request</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pendingRequests.map((request) => (
                            <TableRow key={request.id}>
                              <TableCell className="font-medium">{request.request_title}</TableCell>
                              <TableCell>{request.quantity}</TableCell>
                              <TableCell>{formatDate(request.due_date)}</TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                  request.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                                  request.status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="border rounded-md p-6 text-center text-muted-foreground bg-gray-50 h-full flex items-center justify-center">
                      <div>
                        <p className="text-gray-500 mb-4">No pending requests found</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            const element = document.querySelector('[data-value="food-requests"]');
                            if (element) {
                              (element as HTMLButtonElement).focus();
                            }
                          }}
                        >
                          Create your first request
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card className="border-none shadow-md">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account preferences</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Notification Preferences</h3>
                    <p className="text-sm text-gray-500">
                      Control how and when you receive updates about your requests
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <Button variant="outline" className="justify-start">
                        Configure Email Notifications
                      </Button>
                      <Button variant="outline" className="justify-start">
                        Configure SMS Notifications
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <h3 className="text-lg font-medium pt-4">Security Settings</h3>
                    <p className="text-sm text-gray-500">
                      Manage your account security and password
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <Button variant="outline" className="justify-start">
                        Change Password
                      </Button>
                      <Button variant="outline" className="justify-start">
                        Two-Factor Authentication
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 border-t mt-6 flex justify-end">
                <Button variant="outline" className="mr-2">Cancel</Button>
                <Button variant="destructive" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
};

export default NGODashboard;
