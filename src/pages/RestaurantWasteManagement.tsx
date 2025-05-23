
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

const RestaurantWasteManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [restaurantData, setRestaurantData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [ngoContacts, setNgoContacts] = useState([
    { id: 1, name: "Food Bank NYC", contact: "contact@foodbanknyc.org", specialty: "All food types" },
    { id: 2, name: "Feeding America", contact: "donations@feedingamerica.org", specialty: "Packaged foods" },
    { id: 3, name: "City Harvest", contact: "info@cityharvest.org", specialty: "Fresh produce" },
  ]);

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
          packing_company_id: restaurantData.id,
          requester_id: ngoId,
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
    } catch (error: any) {
      console.error("Error scheduling pickup:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to schedule pickup",
        variant: "destructive",
      });
      throw error;
    }
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <WasteAnalytics />
          <NGOConnections 
            ngoContacts={ngoContacts} 
            onSchedulePickup={handleSchedulePickup} 
          />
        </div>
      </div>
    </div>
  );
};

export default RestaurantWasteManagement;
