
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import RestaurantSidebar from "@/components/restaurant/RestaurantSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import NGOConnections from "@/components/restaurant/waste/NGOConnections";
import WasteAnalytics from "@/components/restaurant/waste/WasteAnalytics";
import { DB_TABLES } from "@/utils/dbUtils";

// Use the interface from NGOConnections component
import type { NGO } from "@/components/restaurant/waste/NGOConnections";

const RestaurantWasteManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [restaurantData, setRestaurantData] = useState<any>(null);
  const [ngos, setNgos] = useState<NGO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    // Check if user is logged in as a restaurant
    const userType = localStorage.getItem("foodieSync_userType");
    const userDataString = localStorage.getItem("foodieSync_userData");

    if (userType !== "restaurant" || !userDataString) {
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
      const parsedData = JSON.parse(userDataString);
      setRestaurantData(parsedData);
      setAuthError("");
      
      // Fetch NGOs from database
      fetchNGOs();
    } catch (error) {
      console.error("Error parsing restaurant data:", error);
      setAuthError("Invalid user data. Please login again.");
      
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
        .select('*')
        .order('name');
      
      if (error) {
        console.error("Error fetching NGOs:", error);
        throw error;
      }
      
      if (data) {
        // Transform data to match the NGO interface from NGOConnections
        const ngoData = data.map(ngo => ({
          id: ngo.id,
          name: ngo.name,
          contact: ngo.name, // Use name as contact since contact field doesn't exist
          specialty: null, // Set to null since specialty field doesn't exist
          address: ngo.address,
          email: ngo.email,
          phone_number: ngo.phone_number ? String(ngo.phone_number) : null // Convert to string
        }));
        setNgos(ngoData);
      }
    } catch (error) {
      console.error("Error fetching NGOs:", error);
      toast({
        title: "Error",
        description: "Failed to load NGOs",
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading data...</p>
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
    <SidebarProvider>
      <div className="flex min-h-screen bg-gray-50">
        <RestaurantSidebar restaurantName={restaurantData?.restaurant_name} />
        
        <div className="flex-1 p-6 md:p-10">
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Food Waste Management
            </h1>
            <p className="text-gray-600">
              Manage food waste and connect with NGOs
            </p>
          </header>

          <Tabs defaultValue="analytics" className="mb-8">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="analytics">Waste Analytics</TabsTrigger>
              <TabsTrigger value="ngo">NGO Connections</TabsTrigger>
            </TabsList>
            
            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle>Food Waste Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <WasteAnalytics />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="ngo">
              <Card>
                <CardHeader>
                  <CardTitle>NGO Connections</CardTitle>
                </CardHeader>
                <CardContent>
                  <NGOConnections restaurantId={restaurantData?.id} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Button 
            variant="ghost" 
            className="flex items-center gap-2 hover:bg-gray-100"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default RestaurantWasteManagement;
