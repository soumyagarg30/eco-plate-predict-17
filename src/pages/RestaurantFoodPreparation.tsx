
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import RestaurantSidebar from "@/components/restaurant/RestaurantSidebar";

const RestaurantFoodPreparation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [restaurantData, setRestaurantData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  
  // Sample prediction data
  const [predictions, setPredictions] = useState([
    { id: 1, dish: "Chicken Alfredo", predicted: 45, unit: "servings", confidence: "High" },
    { id: 2, dish: "Caesar Salad", predicted: 32, unit: "servings", confidence: "Medium" },
    { id: 3, dish: "Garlic Bread", predicted: 60, unit: "pieces", confidence: "High" },
    { id: 4, dish: "Tiramisu", predicted: 28, unit: "slices", confidence: "Medium" },
  ]);
  
  // Sample facility usage
  const [facilityUsage, setFacilityUsage] = useState([
    { id: 1, resource: "Kitchen Space", usagePercent: 75, recommendation: "Reorganize prep stations" },
    { id: 2, resource: "Refrigeration", usagePercent: 60, recommendation: "Optimal usage" },
    { id: 3, resource: "Ovens", usagePercent: 90, recommendation: "Consider staggered prep times" },
    { id: 4, resource: "Staff Allocation", usagePercent: 85, recommendation: "Add 1 more prep cook" },
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
          <h1 className="text-3xl font-bold text-gray-900">Food Preparation Prediction</h1>
          <p className="text-gray-600">
            Optimize food preparation quantities and facility control
          </p>
        </header>

        <Tabs defaultValue="predictions">
          <TabsList className="mb-8">
            <TabsTrigger value="predictions">Quantity Predictions</TabsTrigger>
            <TabsTrigger value="facility">Facility Optimization</TabsTrigger>
          </TabsList>
          
          <TabsContent value="predictions">
            <Card>
              <CardHeader>
                <CardTitle>Today's Preparation Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="rounded-md border">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="py-3 px-4 text-left font-medium text-gray-900">Menu Item</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-900">Predicted Quantity</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-900">Confidence</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {predictions.map((item) => (
                          <tr key={item.id} className="border-t border-gray-200">
                            <td className="py-3 px-4 text-gray-900">{item.dish}</td>
                            <td className="py-3 px-4 text-gray-900">{item.predicted} {item.unit}</td>
                            <td className="py-3 px-4 text-gray-900">{item.confidence}</td>
                            <td className="py-3 px-4">
                              <Button size="sm" variant="outline">Adjust</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="p-4 bg-gray-100 rounded-lg">
                    <h3 className="font-medium text-gray-900">Model Information</h3>
                    <p className="text-gray-600 text-sm">
                      Predictions are based on historical sales data, current reservations, 
                      weather forecasts, and local events. The model is updated daily.
                    </p>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline">Export Data</Button>
                    <Button>Update Predictions</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="facility">
            <Card>
              <CardHeader>
                <CardTitle>Facility Optimization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {facilityUsage.map((resource) => (
                      <Card key={resource.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <h3 className="font-medium text-gray-900">{resource.resource}</h3>
                            <span className="text-gray-900 font-medium">{resource.usagePercent}%</span>
                          </div>
                          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${
                                resource.usagePercent > 85 ? 'bg-red-500' : 
                                resource.usagePercent > 70 ? 'bg-amber-500' : 'bg-green-500'
                              }`} 
                              style={{ width: `${resource.usagePercent}%` }}
                            ></div>
                          </div>
                          <p className="mt-2 text-sm text-gray-600">
                            Recommendation: {resource.recommendation}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  <div className="p-4 bg-gray-100 rounded-lg">
                    <h3 className="font-medium text-gray-900">Staff Scheduling Suggestions</h3>
                    <ul className="mt-2 list-disc pl-5 text-gray-600 space-y-1">
                      <li>Schedule additional prep cook between 2-5pm</li>
                      <li>Consider staggered shifts for line cooks</li>
                      <li>Adjust dishwashing staff for peak dinner rush (7-9pm)</li>
                    </ul>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline">Download Report</Button>
                    <Button>Apply Recommendations</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default RestaurantFoodPreparation;
