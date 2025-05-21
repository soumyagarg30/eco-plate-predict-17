
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import RestaurantSidebar from "@/components/restaurant/RestaurantSidebar";

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
      <RestaurantSidebar restaurantName={restaurantData.restaurant_name} />
      
      <div className="flex-1 p-6 md:p-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Food Waste Management</h1>
          <p className="text-gray-600">
            Reduce food waste and connect with NGOs to donate excess food
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Food Waste Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gray-100 rounded-lg">
                  <h3 className="font-medium text-gray-900">Current Waste Metrics</h3>
                  <p className="text-gray-600">Last week's food waste: 12.5kg</p>
                  <p className="text-gray-600">30-day average: 15.2kg per week</p>
                  <p className="text-gray-600">Top waste category: Vegetables (40%)</p>
                </div>
                
                <div className="p-4 bg-gray-100 rounded-lg">
                  <h3 className="font-medium text-gray-900">Recommendations</h3>
                  <ul className="list-disc pl-5 text-gray-600 space-y-1">
                    <li>Reduce vegetable order by 15%</li>
                    <li>Implement smaller portion sizes for side dishes</li>
                    <li>Utilize bread products in daily specials before expiration</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>NGO Connections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ngoContacts.map((ngo) => (
                  <div key={ngo.id} className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-medium text-gray-900">{ngo.name}</h3>
                    <p className="text-gray-600">{ngo.specialty}</p>
                    <p className="text-gray-600">{ngo.contact}</p>
                    <div className="mt-2 flex space-x-2">
                      <Button variant="outline" size="sm">Contact</Button>
                      <Button size="sm">Schedule Pickup</Button>
                    </div>
                  </div>
                ))}
                <Button className="w-full" variant="outline">Find More NGO Partners</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RestaurantWasteManagement;
