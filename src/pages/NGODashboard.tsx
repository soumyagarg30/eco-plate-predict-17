import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
// Import the DB_TABLES constant from dbUtils
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
  const { toast } = useToast();
  const [ngoData, setNgoData] = useState<any>(null);
  const [restaurantRequests, setRestaurantRequests] = useState<RestaurantRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [authError, setAuthError] = useState("");

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
      
      // Short delay before redirect to ensure toast is shown
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
      
      // Short delay before redirect to ensure toast is shown
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
            // When querying the table, use the correct table name from DB_TABLES
            const { data: restaurantData } = await supabase
              .from(DB_TABLES.RESTAURANTS)
              .select("restaurant_name")
              .eq("id", request.packing_company_id)
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
        <p>Error loading ngo data. Please try logging in again.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <RestaurantSidebar restaurantName={ngoData.name} />
      
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
          <Card className="shadow-md border-none">
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
                  <p className="text-gray-500 mb-2">No food requests from Restaurants yet</p>
                  <p className="text-sm text-gray-400">
                    When Restaurants submit food requests to your NGO, they will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NGODashboard;
