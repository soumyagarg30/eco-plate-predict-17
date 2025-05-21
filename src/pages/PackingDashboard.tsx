
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Package, CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";

interface PackingRequest {
  id: string;
  requester_type: string; // Changed from 'restaurant' | 'ngo' to string to match Supabase data
  requester_id: number;
  request_title: string;
  request_description: string;
  quantity: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  created_at: string;
  due_date: string;
  requester_name?: string;
}

const PackingDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userData, setUserData] = useState<any>(null);
  const [packingRequests, setPackingRequests] = useState<PackingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    const userType = localStorage.getItem("foodieSync_userType");
    const userDataString = localStorage.getItem("foodieSync_userData");
    
    if (!userType || userType !== "packing" || !userDataString) {
      navigate("/login");
      return;
    }
    
    try {
      const parsedData = JSON.parse(userDataString);
      setUserData(parsedData);
      
      // Fetch packing requests for this company
      fetchPackingRequests(parsedData.id);
    } catch (error) {
      console.error("Error parsing user data:", error);
      navigate("/login");
    }
  }, [navigate]);

  const fetchPackingRequests = async (packingCompanyId: number) => {
    try {
      setLoading(true);
      
      // Fetch packing requests
      const { data: requests, error } = await supabase
        .from("packing_requests")
        .select("*")
        .eq("packing_company_id", packingCompanyId);
      
      if (error) throw error;
      
      // Get requester details
      const enrichedRequests = await Promise.all(requests.map(async (request) => {
        let requesterName = "Unknown";
        
        if (request.requester_type === "restaurant") {
          const { data } = await supabase
            .from("Restaurants_Details")
            .select("restaurant_name")
            .eq("id", request.requester_id)
            .single();
          
          if (data) requesterName = data.restaurant_name;
        } else if (request.requester_type === "ngo") {
          const { data } = await supabase
            .from("Ngo's")
            .select("name")
            .eq("id", request.requester_id)
            .single();
          
          if (data) requesterName = data.name;
        }
        
        return { ...request, requester_name: requesterName };
      }));
      
      setPackingRequests(enrichedRequests);
    } catch (err) {
      console.error("Error fetching packing requests:", err);
      toast({
        title: "Error",
        description: "Failed to load packing requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, newStatus: 'approved' | 'rejected' | 'completed') => {
    try {
      const { error } = await supabase
        .from("packing_requests")
        .update({ status: newStatus })
        .eq("id", requestId);
      
      if (error) throw error;
      
      // Update local state
      setPackingRequests(prev => 
        prev.map(req => req.id === requestId ? { ...req, status: newStatus } : req)
      );
      
      toast({
        title: "Success",
        description: `Request ${newStatus} successfully`,
      });
    } catch (err) {
      console.error(`Error updating request status to ${newStatus}:`, err);
      toast({
        title: "Error",
        description: `Failed to update request status`,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">Rejected</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500">Completed</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const refreshData = () => {
    if (userData) {
      fetchPackingRequests(userData.id);
      toast({
        description: "Data refreshed",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Packing Company Dashboard</h1>
          <Button onClick={refreshData} size="sm" variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full md:w-auto md:inline-flex grid-cols-2 md:grid-cols-none">
            <TabsTrigger value="profile">Company Profile</TabsTrigger>
            <TabsTrigger value="requests">Packing Requests</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="mt-6">
            {userData && (
              <Card className="bg-white shadow-md">
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                  <CardDescription>Your packing company details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold">Company Name</h3>
                    <p>{userData.Name}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Email</h3>
                    <p>{userData.Email}</p>
                  </div>
                  {userData.Phone_Number && (
                    <div>
                      <h3 className="font-semibold">Phone</h3>
                      <p>{userData.Phone_Number}</p>
                    </div>
                  )}
                  {userData.Address && (
                    <div>
                      <h3 className="font-semibold">Address</h3>
                      <p>{userData.Address}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="requests" className="mt-6">
            <Card className="bg-white shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Packing Requests
                </CardTitle>
                <CardDescription>Manage requests from restaurants and NGOs</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p>Loading requests...</p>
                  </div>
                ) : packingRequests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No packing requests found</p>
                    <p className="text-sm">Requests from restaurants and NGOs will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {packingRequests.map((request) => (
                      <Card key={request.id} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">{request.request_title}</CardTitle>
                              <CardDescription>
                                From: {request.requester_name} ({request.requester_type})
                              </CardDescription>
                            </div>
                            {getStatusBadge(request.status)}
                          </div>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <p className="text-sm text-gray-700 mb-4">{request.request_description}</p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="font-medium text-gray-500">Quantity:</p>
                              <p>{request.quantity} units</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-500">Due Date:</p>
                              <p>{formatDate(request.due_date)}</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-500">Created:</p>
                              <p>{formatDate(request.created_at)}</p>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="border-t pt-4 flex flex-wrap gap-2">
                          {request.status === 'pending' && (
                            <>
                              <Button 
                                size="sm"
                                className="bg-green-500 hover:bg-green-600"
                                onClick={() => updateRequestStatus(request.id, 'approved')}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                              <Button 
                                size="sm"
                                variant="destructive"
                                onClick={() => updateRequestStatus(request.id, 'rejected')}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </>
                          )}
                          {request.status === 'approved' && (
                            <Button 
                              size="sm"
                              className="bg-blue-500 hover:bg-blue-600"
                              onClick={() => updateRequestStatus(request.id, 'completed')}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark Completed
                            </Button>
                          )}
                          {(request.status === 'rejected' || request.status === 'completed') && (
                            <p className="text-sm text-gray-500 italic py-1">
                              {request.status === 'rejected' ? 'This request was rejected' : 'This request is completed'}
                            </p>
                          )}
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default PackingDashboard;
