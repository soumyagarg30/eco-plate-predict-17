import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import RestaurantMenu from "@/components/restaurant/RestaurantMenu";
import RestaurantDetails from "@/components/restaurant/RestaurantDetails";
import RestaurantSidebar from "@/components/restaurant/RestaurantSidebar";
import { LogOut, Clock, Check, X, Package, Star, MessageSquare } from "lucide-react";

interface NGORequest {
  id: string;
  request_title: string;
  request_description: string;
  quantity: number;
  status: string;
  due_date: string;
  ngo_id: number;
  restaurant_id: number;
  created_at: string;
  ngo_name?: string;
}

interface PackingCompany {
  id: number;
  name: string;
  email: string;
  phone_number?: number;
  address?: string;
}

interface PackingRequest {
  id: string;
  packing_company_id: number;
  requester_id: number;
  requester_type: string;
  request_title: string;
  request_description: string;
  quantity: number;
  due_date: string;
  status: string;
  created_at: string;
  packing_company_name?: string;
}

interface RestaurantRating {
  id: string;
  rating: number;
  review: string | null;
  created_at: string;
  user_id: number;
  user_name?: string;
}

const RestaurantDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [restaurantData, setRestaurantData] = useState<any>(null);
  const [ngoRequests, setNgoRequests] = useState<NGORequest[]>([]);
  const [packingCompanies, setPackingCompanies] = useState<PackingCompany[]>([]);
  const [packingRequests, setPackingRequests] = useState<PackingRequest[]>([]);
  const [restaurantRatings, setRestaurantRatings] = useState<RestaurantRating[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [packingRequestsLoading, setPackingRequestsLoading] = useState(false);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [packingDialogOpen, setPackingDialogOpen] = useState(false);
  const [selectedPackingCompany, setSelectedPackingCompany] = useState("");
  const [packingRequestTitle, setPackingRequestTitle] = useState("");
  const [packingRequestDescription, setPackingRequestDescription] = useState("");
  const [packingQuantity, setPackingQuantity] = useState(0);
  const [packingDueDate, setPackingDueDate] = useState("");
  const [isSubmittingPackingRequest, setIsSubmittingPackingRequest] = useState(false);

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
      
      setTimeout(() => {
        navigate("/login");
      }, 1500);
      return;
    }

    try {
      const parsedData = JSON.parse(userData);
      console.log("Restaurant data loaded:", parsedData);
      
      if (!parsedData || !parsedData.restaurant_name) {
        throw new Error("Invalid restaurant data format");
      }
      
      setRestaurantData(parsedData);
      setAuthError("");
      
      fetchNGORequests(parsedData.id);
      fetchPackingCompanies();
      fetchPackingRequests(parsedData.id);
      fetchRestaurantRatings(parsedData.id);
    } catch (error) {
      console.error("Error parsing restaurant data:", error);
      setAuthError("Invalid restaurant data. Please login again.");
      toast({
        title: "Error",
        description: "Invalid restaurant data. Please login again.",
        variant: "destructive",
      });
      
      localStorage.removeItem("foodieSync_userType");
      localStorage.removeItem("foodieSync_userData");
      
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } finally {
      setIsLoading(false);
    }
  }, [navigate, toast]);

  const fetchPackingRequests = async (restaurantId: number) => {
    setPackingRequestsLoading(true);
    try {
      console.log("Fetching packing requests for restaurant ID:", restaurantId);
      
      const { data: requestsData, error: requestsError } = await supabase
        .from("packing_requests")
        .select("*")
        .eq("requester_id", restaurantId)
        .eq("requester_type", "restaurant")
        .order("created_at", { ascending: false });
      
      if (requestsError) {
        console.error("Error fetching packing requests:", requestsError);
        throw requestsError;
      }
      
      console.log("Packing requests for restaurant:", requestsData);
      
      if (requestsData && requestsData.length > 0) {
        // Fetch packing company names for each request
        const requestsWithCompanyNames = await Promise.all(
          requestsData.map(async (request) => {
            const { data: companyData } = await supabase
              .from("Packing_Companies")
              .select("name")
              .eq("id", request.packing_company_id)
              .single();
            
            return {
              ...request,
              packing_company_name: companyData?.name || "Unknown Company",
            };
          })
        );
        
        console.log("Requests with company names:", requestsWithCompanyNames);
        setPackingRequests(requestsWithCompanyNames);
      } else {
        console.log("No packing requests found for this restaurant");
        setPackingRequests([]);
      }
    } catch (error) {
      console.error("Error fetching packing requests:", error);
      toast({
        title: "Error",
        description: "Failed to load packing requests",
        variant: "destructive",
      });
      setPackingRequests([]);
    } finally {
      setPackingRequestsLoading(false);
    }
  };

  const fetchRestaurantRatings = async (restaurantId: number) => {
    setRatingsLoading(true);
    try {
      console.log("Fetching ratings for restaurant ID:", restaurantId);
      
      const { data: ratingsData, error: ratingsError } = await supabase
        .from("restaurant_ratings")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });
      
      if (ratingsError) {
        console.error("Error fetching restaurant ratings:", ratingsError);
        throw ratingsError;
      }
      
      console.log("Restaurant ratings fetched:", ratingsData);
      
      if (ratingsData && ratingsData.length > 0) {
        // Fetch user names for each rating
        const ratingsWithUserNames = await Promise.all(
          ratingsData.map(async (rating) => {
            const { data: userData } = await supabase
              .from("User_Details")
              .select("name")
              .eq("id", rating.user_id)
              .single();
            
            return {
              ...rating,
              user_name: userData?.name || "Anonymous User",
            };
          })
        );
        
        console.log("Ratings with user names:", ratingsWithUserNames);
        setRestaurantRatings(ratingsWithUserNames);
      } else {
        console.log("No ratings found for this restaurant");
        setRestaurantRatings([]);
      }
    } catch (error) {
      console.error("Error fetching restaurant ratings:", error);
      toast({
        title: "Error",
        description: "Failed to load restaurant ratings",
        variant: "destructive",
      });
      setRestaurantRatings([]);
    } finally {
      setRatingsLoading(false);
    }
  };

  const fetchPackingCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from("Packing_Companies")
        .select("*")
        .order("name");

      if (error) throw error;
      setPackingCompanies(data || []);
    } catch (error) {
      console.error("Error fetching packing companies:", error);
      toast({
        title: "Error",
        description: "Failed to load packing companies",
        variant: "destructive",
      });
    }
  };
  
  const fetchNGORequests = async (restaurantId: number) => {
    setRequestsLoading(true);
    try {
      console.log("Fetching NGO requests for restaurant ID:", restaurantId);
      
      // Fetch all requests to debug
      const { data: allRequestsData, error: allRequestsError } = await supabase
        .from("ngo_food_requests")
        .select("*");
      
      console.log("All NGO requests in database:", allRequestsData);
      
      if (allRequestsError) {
        console.error("Error fetching all requests:", allRequestsError);
      }
      
      // Now get requests for this specific restaurant
      const { data: requestsData, error: requestsError } = await supabase
        .from("ngo_food_requests")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });
      
      if (requestsError) {
        console.error("Error fetching NGO requests:", requestsError);
        throw requestsError;
      }
      
      console.log("NGO requests for restaurant:", requestsData);
      
      if (requestsData && requestsData.length > 0) {
        // Fetch NGO names for each request
        const requestsWithNGONames = await Promise.all(
          requestsData.map(async (request) => {
            const { data: ngoData } = await supabase
              .from("Ngo's")
              .select("name")
              .eq("id", request.ngo_id)
              .single();
            
            return {
              ...request,
              ngo_name: ngoData?.name || "Unknown NGO",
            };
          })
        );
        
        console.log("Requests with NGO names:", requestsWithNGONames);
        setNgoRequests(requestsWithNGONames);
      } else {
        console.log("No requests found for this restaurant");
        setNgoRequests([]);
      }
    } catch (error) {
      console.error("Error fetching NGO requests:", error);
      toast({
        title: "Error",
        description: "Failed to load NGO requests",
        variant: "destructive",
      });
      setNgoRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handlePackingRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingPackingRequest(true);
    
    if (!selectedPackingCompany || !packingRequestTitle || !packingRequestDescription || packingQuantity <= 0 || !packingDueDate) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      setIsSubmittingPackingRequest(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("packing_requests")
        .insert({
          packing_company_id: parseInt(selectedPackingCompany),
          requester_id: restaurantData.id,
          requester_type: "restaurant",
          request_title: packingRequestTitle,
          request_description: packingRequestDescription,
          quantity: packingQuantity,
          due_date: packingDueDate,
          status: "pending"
        });
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Packing request sent successfully",
      });
      
      // Reset form
      setPackingRequestTitle("");
      setPackingRequestDescription("");
      setPackingQuantity(0);
      setPackingDueDate("");
      setSelectedPackingCompany("");
      setPackingDialogOpen(false);
      
      // Refresh packing requests
      if (restaurantData?.id) {
        fetchPackingRequests(restaurantData.id);
      }
      
    } catch (error: any) {
      console.error("Error sending packing request:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send packing request",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingPackingRequest(false);
    }
  };
  
  const handleUpdateRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      console.log("Updating request status:", { requestId, newStatus });
      
      const { error } = await supabase
        .from("ngo_food_requests")
        .update({ status: newStatus })
        .eq("id", requestId);
      
      if (error) {
        console.error("Error updating request status:", error);
        throw error;
      }
      
      toast({
        title: "Success",
        description: `Request ${newStatus} successfully`,
      });
      
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

  const handleRestaurantUpdate = (updatedData: any) => {
    setRestaurantData(updatedData);
    localStorage.setItem("foodieSync_userData", JSON.stringify(updatedData));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const calculateAverageRating = (): string => {
    if (restaurantRatings.length === 0) return "0.0";
    const sum = restaurantRatings.reduce((acc, rating) => acc + rating.rating, 0);
    return (sum / restaurantRatings.length).toFixed(1);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
        }`}
      />
    ));
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
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="mb-8">
              <TabsTrigger value="details">Restaurant Details</TabsTrigger>
              <TabsTrigger value="menu">Menu Management</TabsTrigger>
              <TabsTrigger value="requests">NGO Requests</TabsTrigger>
              <TabsTrigger value="packing">Packing Requests</TabsTrigger>
              <TabsTrigger value="ratings">Ratings & Reviews</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details">
              <RestaurantDetails
                restaurantId={restaurantData.id}
                restaurantData={restaurantData}
                onUpdate={handleRestaurantUpdate}
              />
            </TabsContent>
            
            <TabsContent value="menu">
              <Card className="shadow-md border-none">
                <CardContent className="p-6">
                  <RestaurantMenu restaurantId={restaurantData.id} />
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
                      <div className="mt-4 text-xs text-gray-400">
                        Restaurant ID: {restaurantData.id}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="packing">
              <Card className="shadow-md border-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Packing Requests
                  </CardTitle>
                  <CardDescription>
                    Request packaging materials and services from packing companies
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <Dialog open={packingDialogOpen} onOpenChange={setPackingDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          New Packing Request
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Request Packaging Services</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handlePackingRequest} className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <Label htmlFor="packing-company">Select Packing Company</Label>
                            <Select value={selectedPackingCompany} onValueChange={setSelectedPackingCompany} required>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a packing company" />
                              </SelectTrigger>
                              <SelectContent>
                                {packingCompanies.map((company) => (
                                  <SelectItem key={company.id} value={company.id.toString()}>
                                    {company.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="packing-title">Request Title</Label>
                            <Input
                              id="packing-title"
                              placeholder="E.g., Food Container Packaging"
                              value={packingRequestTitle}
                              onChange={(e) => setPackingRequestTitle(e.target.value)}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="packing-description">Description</Label>
                            <Textarea
                              id="packing-description"
                              placeholder="Describe your packaging needs"
                              value={packingRequestDescription}
                              onChange={(e) => setPackingRequestDescription(e.target.value)}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="packing-quantity">Quantity Needed</Label>
                            <Input
                              id="packing-quantity"
                              type="number"
                              min="1"
                              placeholder="Number of units"
                              value={packingQuantity || ""}
                              onChange={(e) => setPackingQuantity(parseInt(e.target.value))}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="packing-due-date">Needed By</Label>
                            <Input
                              id="packing-due-date"
                              type="date"
                              value={packingDueDate}
                              onChange={(e) => setPackingDueDate(e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                              required
                            />
                          </div>
                          <DialogFooter>
                            <Button type="submit" disabled={isSubmittingPackingRequest}>
                              {isSubmittingPackingRequest ? "Sending..." : "Send Request"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {packingRequestsLoading ? (
                    <div className="text-center py-10">
                      <p className="text-gray-500">Loading packing requests...</p>
                    </div>
                  ) : packingRequests.length > 0 ? (
                    <div className="border rounded-md overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-gray-50">
                          <TableRow>
                            <TableHead>Packing Company</TableHead>
                            <TableHead>Request</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Needed By</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date Sent</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {packingRequests.map((request) => (
                            <TableRow key={request.id}>
                              <TableCell className="font-medium">
                                {request.packing_company_name}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{request.request_title}</div>
                                  <div className="text-sm text-gray-500 truncate max-w-xs">
                                    {request.request_description}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{request.quantity} units</TableCell>
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
                              <TableCell>{formatDate(request.created_at)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center p-10 border rounded-md bg-gray-50">
                      <Package className="mx-auto h-10 w-10 text-gray-400 mb-4" />
                      <p className="text-gray-500 mb-2">No packing requests yet</p>
                      <p className="text-sm text-gray-400">
                        Click "New Packing Request" to send a request to packing companies
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ratings">
              <Card className="shadow-md border-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Ratings & Reviews
                  </CardTitle>
                  <CardDescription>
                    View all ratings and reviews from your customers
                  </CardDescription>
                  {restaurantRatings.length > 0 && (
                    <div className="flex items-center gap-2 mt-4 p-4 bg-yellow-50 rounded-lg">
                      <div className="flex items-center gap-1">
                        {renderStars(Math.round(parseFloat(calculateAverageRating())))}
                      </div>
                      <span className="font-semibold text-lg">{calculateAverageRating()}</span>
                      <span className="text-gray-600">
                        ({restaurantRatings.length} review{restaurantRatings.length !== 1 ? 's' : ''})
                      </span>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {ratingsLoading ? (
                    <div className="text-center py-10">
                      <p className="text-gray-500">Loading ratings...</p>
                    </div>
                  ) : restaurantRatings.length > 0 ? (
                    <div className="space-y-4">
                      {restaurantRatings.map((rating) => (
                        <Card key={rating.id} className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                {renderStars(rating.rating)}
                              </div>
                              <span className="font-medium">{rating.user_name}</span>
                            </div>
                            <span className="text-sm text-gray-500">
                              {formatDate(rating.created_at)}
                            </span>
                          </div>
                          {rating.review && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-start gap-2">
                                <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <p className="text-gray-700 text-sm leading-relaxed">
                                  {rating.review}
                                </p>
                              </div>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-10 border rounded-md bg-gray-50">
                      <Star className="mx-auto h-10 w-10 text-gray-400 mb-4" />
                      <p className="text-gray-500 mb-2">No ratings or reviews yet</p>
                      <p className="text-sm text-gray-400">
                        When customers rate your restaurant, their reviews will appear here
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
