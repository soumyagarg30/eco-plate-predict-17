
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import NGOSidebar from "@/components/ngo/NGOSidebar";
import FoodRequestForm from "@/components/ngo/FoodRequestForm";
import { LogOut, Clock, Check, X } from "lucide-react";
import { DB_TABLES } from "@/utils/dbUtils";

interface RestaurantRequest {
  id: string;
  request_title: string;
  request_description: string;
  quantity: number;
  status: string;
  due_date: string;
  requester_id: number;
  requester_type: string;
  created_at: string;
  restaurant_name?: string;
}

const NGODashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [ngoData, setNgoData] = useState<any>(null);
  const [restaurantRequests, setRestaurantRequests] = useState<RestaurantRequest[]>([]);
  const [ngoRequests, setNgoRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [activeTab, setActiveTab] = useState(() => {
    return searchParams.get("tab") || "overview";
  });

  useEffect(() => {
    // Update URL when tab changes
    if (activeTab !== "overview") {
      setSearchParams({ tab: activeTab });
    } else {
      setSearchParams({});
    }
  }, [activeTab, setSearchParams]);

  useEffect(() => {
    // Set active tab based on URL params
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    // Check if user is logged in as ngo
    const userType = localStorage.getItem("foodieSync_userType");
    const userData = localStorage.getItem("foodieSync_userData");

    console.log("Dashboard check:", { userType, userData });

    if (userType !== "ngo" || !userData) {
      console.log("Not authenticated as ngo, redirecting to login");
      setAuthError("Please login as a NGO to access this page");
      toast({
        title: "Unauthorized",
        description: "Please login as a NGO to access this page",
        variant: "destructive",
      });
      
      setTimeout(() => {
        navigate("/login");
      }, 1500);
      return;
    }

    try {
      // Set ngo data
      const parsedData = JSON.parse(userData);
      console.log("NGO data loaded:", parsedData);
      
      // Check if the data has expected ngo properties - use lowercase name
      if (!parsedData || !parsedData.name) {
        throw new Error("Invalid ngo data format");
      }
      
      setNgoData(parsedData);
      setAuthError("");
      
      // Fetch restaurant requests for this ngo
      fetchRestaurantRequests(parsedData.id);
      // Fetch NGO's own food requests
      fetchNGORequests(parsedData.id);
    } catch (error) {
      console.error("Error parsing ngo data:", error);
      setAuthError("Invalid ngo data. Please login again.");
      toast({
        title: "Error",
        description: "Invalid ngo data. Please login again.",
        variant: "destructive",
      });
      
      // Clear invalid data
      localStorage.removeItem("foodieSync_userType");
      localStorage.removeItem("foodieSync_userData");
      
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } finally {
      setIsLoading(false);
    }
  }, [navigate, toast]);
  
  const fetchRestaurantRequests = async (ngoId: number) => {
    setRequestsLoading(true);
    try {
      // Fetch requests directed to this ngo
      const { data: requestsData, error: requestsError } = await supabase
        .from("packing_requests")
        .select("*")
        .eq("requester_type", "restaurant")
        .eq("packing_company_id", ngoId);
      
      if (requestsError) throw requestsError;
      
      if (requestsData) {
        // Get restaurant details for each request
        const requestsWithRestaurantNames = await Promise.all(
          requestsData.map(async (request) => {
            // Use the correct table name with proper capitalization from DB_TABLES
            const { data: restaurantData } = await supabase
              .from(DB_TABLES.RESTAURANTS)
              .select("restaurant_name")
              .eq("id", request.requester_id)
              .single();
            
            return {
              ...request,
              restaurant_name: restaurantData?.restaurant_name || "Unknown Restaurant",
            };
          })
        );
        
        setRestaurantRequests(requestsWithRestaurantNames);
      }
    } catch (error) {
      console.error("Error fetching restaurant requests:", error);
      toast({
        title: "Error",
        description: "Failed to load restaurant requests",
        variant: "destructive",
      });
    } finally {
      setRequestsLoading(false);
    }
  };

  const fetchNGORequests = async (ngoId: number) => {
    try {
      const { data, error } = await supabase
        .from("packing_requests")
        .select("*, Restaurants_Details(restaurant_name)")
        .eq("requester_id", ngoId)
        .eq("requester_type", "ngo")
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      
      setNgoRequests(data || []);
    } catch (error) {
      console.error("Error fetching NGO requests:", error);
      toast({
        title: "Error",
        description: "Failed to load your food requests",
        variant: "destructive",
      });
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
      if (ngoData?.id) {
        fetchRestaurantRequests(ngoData.id);
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

  const handleRequestSuccess = () => {
    // Refresh the requests list
    if (ngoData?.id) {
      fetchNGORequests(ngoData.id);
    }
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

  if (!ngoData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Error loading NGO data. Please try logging in again.</p>
      </div>
    );
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'accepted': return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'rejected': return 'bg-red-100 text-red-800 hover:bg-red-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <NGOSidebar ngoName={ngoData.name} />
      
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 py-4 px-6 shadow-sm flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {ngoData.name}
            </h1>
            <p className="text-gray-600 text-sm">
              NGO Dashboard
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
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-8">
              <TabsTrigger value="overview">Dashboard</TabsTrigger>
              <TabsTrigger value="food-requests">Food Requests</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <Card className="shadow-md border-none mb-6">
                <CardHeader>
                  <CardTitle>Restaurant Food Requests</CardTitle>
                  <CardDescription>
                    Manage and respond to food requests from Restaurants
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {requestsLoading ? (
                    <div className="text-center py-10">
                      <p className="text-gray-500">Loading requests...</p>
                    </div>
                  ) : restaurantRequests.length > 0 ? (
                    <div className="border rounded-md overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-gray-50">
                          <TableRow>
                            <TableHead>Restaurant</TableHead>
                            <TableHead>Request</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Needed By</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {restaurantRequests.map((request) => (
                            <TableRow key={request.id}>
                              <TableCell className="font-medium">
                                {request.restaurant_name}
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
                                <Badge className={getStatusBadgeClass(request.status)}>
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
                      <p className="text-gray-500 mb-2">No food requests from Restaurants yet</p>
                      <p className="text-sm text-gray-400">
                        When Restaurants submit food requests to your NGO, they will appear here
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="food-requests">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <FoodRequestForm 
                    ngoId={ngoData.id} 
                    onSuccess={handleRequestSuccess} 
                  />
                </div>
                <div className="lg:col-span-2">
                  <Card className="shadow-md border-none">
                    <CardHeader>
                      <CardTitle>Your Food Requests</CardTitle>
                      <CardDescription>
                        Manage your requests to restaurants for food donations
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {ngoRequests.length > 0 ? (
                        <div className="border rounded-md overflow-x-auto">
                          <Table>
                            <TableHeader className="bg-gray-50">
                              <TableRow>
                                <TableHead>Request</TableHead>
                                <TableHead>Restaurant</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Needed By</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {ngoRequests.map((request) => (
                                <TableRow key={request.id}>
                                  <TableCell>
                                    <div>
                                      <div className="font-medium">{request.request_title}</div>
                                      <div className="text-sm text-gray-500 truncate max-w-xs">
                                        {request.request_description}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {request.Restaurants_Details?.restaurant_name || "Unknown Restaurant"}
                                  </TableCell>
                                  <TableCell>{request.quantity} servings</TableCell>
                                  <TableCell>{formatDate(request.due_date)}</TableCell>
                                  <TableCell>
                                    <Badge className={getStatusBadgeClass(request.status)}>
                                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center p-10 border rounded-md bg-gray-50">
                          <Clock className="mx-auto h-10 w-10 text-gray-400 mb-4" />
                          <p className="text-gray-500 mb-2">No food requests created yet</p>
                          <p className="text-sm text-gray-400">
                            Use the form on the left to create your first food request
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default NGODashboard;
