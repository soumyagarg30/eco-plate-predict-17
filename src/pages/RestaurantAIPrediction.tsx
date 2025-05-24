
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import RestaurantSidebar from "@/components/restaurant/RestaurantSidebar";
import { FoodPlanningForm } from "@/components/restaurant/FoodPlanningML";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const RestaurantAIPrediction = () => {
  const navigate = useNavigate();
  const [restaurantData, setRestaurantData] = useState<any>(null);

  useEffect(() => {
    // Get restaurant data from localStorage
    const userData = localStorage.getItem("foodieSync_userData");
    const userType = localStorage.getItem("foodieSync_userType");
    
    if (!userData || userType !== "restaurant") {
      navigate("/login");
      return;
    }

    try {
      const parsedData = JSON.parse(userData);
      setRestaurantData(parsedData);
    } catch (error) {
      console.error("Error parsing restaurant data:", error);
      navigate("/login");
    }
  }, [navigate]);

  if (!restaurantData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <RestaurantSidebar restaurantName={restaurantData.restaurant_name} />
      
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header with back button */}
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => navigate("/restaurant-dashboard")}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                AI Food Planning & Prediction
              </h1>
              <p className="text-gray-600">
                Use our advanced machine learning model to optimize your food planning and reduce waste
              </p>
            </div>
          </div>

          {/* ML Model Component */}
          <FoodPlanningForm restaurantId={restaurantData.id} />
        </div>
      </div>
    </div>
  );
};

export default RestaurantAIPrediction;
