
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Package, CheckCircle, XCircle, Clock, RefreshCw, Building, Settings, ClipboardList, User, LogOut } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

interface PackingRequest {
  id: string;
  requester_type: string; // Changed from 'restaurant' | 'ngo' to string to match Supabase data
  requester_id: number;
  request_title: string;
  request_description: string;
  quantity: number;
  status: string; // Changed from 'pending' | 'approved' | 'rejected' | 'completed' to string to match Supabase data
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

  const handleLogout = () => {
    localStorage.removeItem("foodieSync_userType");
    localStorage.removeItem("foodieSync_userData");
    toast({
      title: "Success",
      description: "You have been logged out successfully",
    });
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Welcome, {userData?.name}</h2>
          <p className="text-gray-600 mt-1">
            Manage your packing company and handle requests
          </p>
        </div>

        <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full md:w-[500px] grid-cols-3 mb-8 bg-gray-100 p-1 rounded-lg">
            <TabsTrigger value="profile" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="requests" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <ClipboardList className="h-4 w-4 mr-2" />
              Packing Requests
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="mt-6">
            <Card className="border-none shadow-md">
              <CardHeader className="bg-blue-50 border-b pb-8 pt-8">
                <CardTitle className="text-2xl font-bold text-blue-800">Company Profile</CardTitle>
                <CardDescription className="text-blue-600">
                  View and manage your packing company details
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-8">
                {userData && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-1">
                        <h3 className="text-sm font-medium text-gray-500">Company Name</h3>
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
          
          <TabsContent value="requests" className="mt-6">
            <Card className="bg-white shadow-md">
              <CardHeader className="border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Packing Requests
                    </CardTitle>
                    <CardDescription>Manage requests from restaurants and NGOs</CardDescription>
                  </div>
                  <Button onClick={refreshData} size="sm" variant="outline" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
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
                      <Card key={request.id} className="overflow-hidden border border-gray-200">
                        <CardHeader className="pb-2 bg-gray-50">
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
                        <CardContent className="pb-2 pt-4">
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
                        <CardFooter className="border-t pt-4 flex flex-wrap gap-2 bg-gray-50">
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
                      Control how and when you receive updates about requests
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

export default PackingDashboard;
