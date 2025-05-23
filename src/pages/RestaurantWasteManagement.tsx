import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import RestaurantSidebar from "@/components/restaurant/RestaurantSidebar";
import { supabase } from "@/integrations/supabase/client";
import WasteAnalytics from "@/components/restaurant/waste/WasteAnalytics";
import NGOConnections from "@/components/restaurant/waste/NGOConnections";
import { PickupFormData } from "@/components/restaurant/waste/PickupForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DB_TABLES } from "@/utils/dbUtils";

// Update the NGO interface to match the table structure
interface NGO {
  id: number;
  name: string;
  contact: string; // Required field in the table
  specialty?: string | null;
  address?: string | null;
  email?: string;
  phone_number?: number | null;
  created_at?: string;
}

interface PickupRequest {
  id: string;
  request_title: string;
  request_description: string | null;
  quantity: number;
  due_date: string;
  status: string;
  created_at: string;
  ngo_name?: string;
}

const RestaurantWasteManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [restaurantData, setRestaurantData] = useState<any>(null);
  const [ngoContacts, setNgoContacts] = useState<NGO[]>([]);
  const [pickupRequests, setPickupRequests] = useState<PickupRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    // Check if user is logged in as restaurant
    const userType = localStorage.getItem("foodieSync_userType");
    const userData = localStorage.getItem("foodieSync_userData");

    if (userType !== "restaurant" || !userData) {
      setAuthError("Please login as a restaurant to access this page");
      toast({
        title: "Unauthorized",
        description: "Please login as a restaurant to access this page",
        variant: "destructive",
      });
      
      setTimeout(() => {
        navigate("/login");
      }, 1500);
      return;
    }

    try {
      const parsedData = JSON.parse(userData);
      if (!parsedData || !parsedData.restaurant_name) {
        throw new Error("Invalid restaurant data format");
      }
      
      setRestaurantData(parsedData);
      setAuthError("");
      
      // Fetch NGOs from database
      fetchNGOs();
      
      // Fetch pickup requests for this restaurant
      if (parsedData.id) {
        fetchPickupRequests(parsedData.id);
      }
    } catch (error) {
      console.error("Error parsing restaurant data:", error);
      setAuthError("Invalid restaurant data. Please login again.");
      
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } finally {
      setIsLoading(false);
    }
  }, [navigate, toast]);
  
  const fetchNGOs = async () => {
    try {
      const { data, error } = await supabase
        .from(DB_TABLES.NGOS)
        .select('*');
    
      if (error) throw error;
      
      if (data) {
        // Map the data to ensure it matches our NGO interface
        const ngoData = data.map(ngo => ({
          id: ngo.id,
          name: ngo.name,
          contact: ngo.contact || ngo.name, // Ensure contact field is present
          specialty: ngo.specialty,
          address: ngo.address,
          email: ngo.email,
          phone_number: ngo.phone_number,
          created_at: ngo.created_at
        }));
        
        setNgoContacts(ngoData);
      }
    } catch (error) {
      console.error("Error fetching NGOs:", error);
      toast({
        title: "Error",
        description: "Failed to load NGO contacts",
        variant: "destructive",
      });
    }
  };
  
  const fetchPickupRequests = async (restaurantId: number) => {
    setRequestsLoading(true);
    try {
      // Fetch requests created by this restaurant
      const { data: requestsData, error: requestsError } = await supabase
        .from("packing_requests")
        .select("*")
        .eq("requester_id", restaurantId)
        .eq("requester_type", "restaurant");
      
      if (requestsError) throw requestsError;
      
      if (requestsData) {
        // Get NGO names for each request
        const requestsWithNGONames = await Promise.all(
          requestsData.map(async (request) => {
            const { data: ngoData } = await supabase
              .from("Ngo's")
              .select("name")
              .eq("id", request.packing_company_id)
              .single();
            
            return {
              ...request,
              ngo_name: ngoData?.name || "Unknown NGO",
            };
          })
        );
        
        setPickupRequests(requestsWithNGONames);
      }
    } catch (error) {
      console.error("Error fetching pickup requests:", error);
      toast({
        title: "Error",
        description: "Failed to load pickup requests",
        variant: "destructive",
      });
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleSchedulePickup = async (ngoId: number, formData: PickupFormData) => {
    const { foodDescription, quantity, dueDate } = formData;
    
    if (!foodDescription || quantity <= 0 || !dueDate) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create a new pickup request
      const { error } = await supabase
        .from("packing_requests")
        .insert({
          packing_company_id: ngoId,
          requester_id: restaurantData.id,
          requester_type: "restaurant",
          request_title: `Food Pickup Request: ${foodDescription.substring(0, 30)}`,
          request_description: foodDescription,
          quantity: quantity,
          due_date: dueDate,
          status: "pending"
        });
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Pickup scheduled successfully",
      });
      
      // Refresh the requests list
      fetchPickupRequests(restaurantData.id);
    } catch (error: any) {
      console.error("Error scheduling pickup:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to schedule pickup",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex items-center justify-center h-screen flex-col gap-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{authError}</AlertDescription>
        </Alert>
        <Button onClick={() => navigate("/login")}>Go to Login</Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <RestaurantSidebar restaurantName={restaurantData?.restaurant_name} />
      
      <div className="flex-1 p-6 md:p-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Food Waste Management</h1>
          <p className="text-gray-600">
            Reduce food waste and connect with NGOs to donate excess food
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <WasteAnalytics />
            <NGOConnections 
              ngoContacts={ngoContacts} 
              onSchedulePickup={handleSchedulePickup} 
            />
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Your Pickup Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {requestsLoading ? (
                <div className="text-center py-10">
                  <p className="text-gray-500">Loading requests...</p>
                </div>
              ) : pickupRequests.length > 0 ? (
                <div className="border rounded-md overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead>NGO</TableHead>
                        <TableHead>Food Description</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Pickup Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pickupRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">
                            {request.ngo_name}
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs truncate">
                              {request.request_description}
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center p-10 border rounded-md bg-gray-50">
                  <p className="text-gray-500 mb-2">No pickup requests yet</p>
                  <p className="text-sm text-gray-400">
                    Schedule a pickup with an NGO to see it listed here
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

export default RestaurantWasteManagement;
