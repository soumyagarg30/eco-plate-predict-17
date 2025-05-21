
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import RestaurantMenu from "@/components/restaurant/RestaurantMenu";
import FoodPrepModel from "@/components/restaurant/FoodPrepModel";
import RestaurantSidebar from "@/components/restaurant/RestaurantSidebar";
import { LogOut, Clock, Check, X } from "lucide-react";

interface NGORequest {
  id: string;
  request_title: string;
  request_description: string;
  quantity: number;
  status: string;
  due_date: string;
  requester_id: number;
  requester_type: string;
  created_at: string;
  ngo_name?: string;
}

const RestaurantDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [restaurantData, setRestaurantData] = useState<any>(null);
  const [ngoRequests, setNgoRequests] = useState<NGORequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    // Check if user is logged in as restaurant
    const userType = localStorage.getItem("foodieSync_userType");
    const userData = localStorage.getItem("foodieSync_userData");

    console.log("Dashboard check:", { userType, userData });

    if (userType !== "restaurant" || !userData) {
      console.log("Not authenticated as restaurant, redirecting to login");
      setAuthError("Please login as a restaurant to access this page");
      toast({
        title: "Unauthorized",
        description: "Please login as a restaurant to access this page",
        variant: "destructive",
      });
      
      // Short delay before redirect to ensure toast is shown
      setTimeout(() => {
        navigate("/login");
      }, 1500);
      return;
    }

    try {
      // Set restaurant data
      const parsedData = JSON.parse(userData);
      console.log("Restaurant data loaded:", parsedData);
      
      // Check if the data has expected restaurant properties - use lowercase restaurant_name
      if (!parsedData || !parsedData.restaurant_name) {
        throw new Error("Invalid restaurant data format");
      }
      
      setRestaurantData(parsedData);
      setAuthError("");
      
      // Fetch NGO requests for this restaurant
      fetchNGORequests(parsedData.id);
    } catch (error) {
      console.error("Error parsing restaurant data:", error);
      setAuthError("Invalid restaurant data. Please login again.");
      toast({
        title: "Error",
        description: "Invalid restaurant data. Please login again.",
        variant: "destructive",
      });
      
      // Clear invalid data
      localStorage.removeItem("foodieSync_userType");
      localStorage.removeItem("foodieSync_userData");
      
      // Short delay before redirect to ensure toast is shown
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } finally {
      setIsLoading(false);
    }
  }, [navigate, toast]);
  
  const fetchNGORequests = async (restaurantId: number) => {
    setRequestsLoading(true);
    try {
      // Fetch requests directed to this restaurant
      const { data: requestsData, error: requestsError } = await supabase
        .from("packing_requests")
        .select("*")
        .eq("packing_company_id", restaurantId)
        .eq("requester_type", "ngo");
      
      if (requestsError) throw requestsError;
      
      if (requestsData) {
        // Get NGO details for each request
        const requestsWithNGONames = await Promise.all(
          requestsData.map(async (request) => {
            const { data: ngoData } = await supabase
              .from("Ngo's")
              .select("Name")
              .eq("id", request.requester_id)
              .single();
            
            return {
              ...request,
              ngo_name: ngoData?.Name || "Unknown NGO",
            };
          })
        );
        
        setNgoRequests(requestsWithNGONames);
      }
    } catch (error) {
      console.error("Error fetching NGO requests:", error);
      toast({
        title: "Error",
        description: "Failed to load NGO requests",
        variant: "destructive",
      });
    } finally {
      setRequestsLoading(false);
    }
  };
  
  const handleUpdateRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("packing_requests")
        .update({ status: newStatus })
        .eq("id", requestId);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Request ${newStatus} successfully`,
      });
      
      // Refresh the requests list
      if (restaurantData?.id) {
        fetchNGORequests(restaurantData.id);
      }
    } catch (error) {
      console.error("Error updating request status:", error);
      toast({
        title: "Error",
        description: "Failed to update request status",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("foodieSync_userType");
    localStorage.removeItem("foodieSync_userData");
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
    navigate("/login");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex items-center justify-center h-screen flex-col gap-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{authError}</AlertDescription>
        </Alert>
        <button 
          onClick={() => navigate("/login")}
          className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
        >
          Go to Login
        </button>
      </div>
    );
  }

  if (!restaurantData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Error loading restaurant data. Please try logging in again.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <RestaurantSidebar restaurantName={restaurantData.restaurant_name} />
      
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 py-4 px-6 shadow-sm flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {restaurantData.restaurant_name}
            </h1>
            <p className="text-gray-600 text-sm">
              Restaurant Dashboard
            </p>
          </div>
          <Button 
            variant="ghost" 
            className="flex items-center gap-2 hover:bg-gray-100"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </header>

        <div className="flex-1 p-6 md:p-10">
          <Tabs defaultValue="menu" className="w-full">
            <TabsList className="mb-8">
              <TabsTrigger value="menu">Menu Management</TabsTrigger>
              <TabsTrigger value="prep">Food Preparation Model</TabsTrigger>
              <TabsTrigger value="requests">NGO Requests</TabsTrigger>
            </TabsList>
            
            <TabsContent value="menu">
              <Card className="shadow-md border-none">
                <CardContent className="p-6">
                  <RestaurantMenu restaurantId={restaurantData.id} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="prep">
              <Card className="shadow-md border-none">
                <CardContent className="p-6">
                  <FoodPrepModel restaurantId={restaurantData.id} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="requests">
              <Card className="shadow-md border-none">
                <CardHeader>
                  <CardTitle>NGO Food Requests</CardTitle>
                  <CardDescription>
                    Manage and respond to food requests from NGOs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {requestsLoading ? (
                    <div className="text-center py-10">
                      <p className="text-gray-500">Loading requests...</p>
                    </div>
                  ) : ngoRequests.length > 0 ? (
                    <div className="border rounded-md overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-gray-50">
                          <TableRow>
                            <TableHead>NGO</TableHead>
                            <TableHead>Request</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Needed By</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ngoRequests.map((request) => (
                            <TableRow key={request.id}>
                              <TableCell className="font-medium">
                                {request.ngo_name}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{request.request_title}</div>
                                  <div className="text-sm text-gray-500 truncate max-w-xs">
                                    {request.request_description}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{request.quantity} servings</TableCell>
                              <TableCell>{formatDate(request.due_date)}</TableCell>
                              <TableCell>
                                <Badge className={
                                  request.status === 'pending' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' : 
                                  request.status === 'accepted' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 
                                  request.status === 'completed' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' :
                                  'bg-red-100 text-red-800 hover:bg-red-200'
                                }>
                                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  {request.status === 'pending' && (
                                    <>
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="flex items-center gap-1 border-green-500 text-green-600 hover:bg-green-50"
                                        onClick={() => handleUpdateRequestStatus(request.id, 'accepted')}
                                      >
                                        <Check className="h-3 w-3" />
                                        Accept
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="flex items-center gap-1 border-red-500 text-red-600 hover:bg-red-50"
                                        onClick={() => handleUpdateRequestStatus(request.id, 'rejected')}
                                      >
                                        <X className="h-3 w-3" />
                                        Decline
                                      </Button>
                                    </>
                                  )}
                                  {request.status === 'accepted' && (
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="flex items-center gap-1 border-blue-500 text-blue-600 hover:bg-blue-50"
                                      onClick={() => handleUpdateRequestStatus(request.id, 'completed')}
                                    >
                                      <Check className="h-3 w-3" />
                                      Mark as Completed
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center p-10 border rounded-md bg-gray-50">
                      <Clock className="mx-auto h-10 w-10 text-gray-400 mb-4" />
                      <p className="text-gray-500 mb-2">No food requests from NGOs yet</p>
                      <p className="text-sm text-gray-400">
                        When NGOs submit food requests to your restaurant, they will appear here
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDashboard;
