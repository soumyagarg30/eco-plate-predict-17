
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import NGOSidebar from "@/components/ngo/NGOSidebar";
import FoodRequestForm from "@/components/ngo/FoodRequestForm";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const NGODashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ngoData, setNgoData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
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

  const handleLogout = () => {
    localStorage.removeItem("foodieSync_userType");
    localStorage.removeItem("foodieSync_userData");
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
    navigate("/login");
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
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="mb-8">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="food-requests">Food Requests</TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard">
              <Card className="shadow-md border-none">
                <CardHeader>
                  <CardTitle>Welcome to your NGO Dashboard</CardTitle>
                  <CardDescription>
                    Manage your organization's activities and food requests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center p-10">
                    <p className="text-gray-500 mb-2">Your NGO dashboard overview</p>
                    <p className="text-sm text-gray-400">
                      Use the tabs above to navigate to different sections
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="food-requests">
              <Card className="shadow-md border-none">
                <CardHeader>
                  <CardTitle>Submit Food Request</CardTitle>
                  <CardDescription>
                    Request food from restaurants for your organization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FoodRequestForm ngoId={ngoData.id} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default NGODashboard;
