
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PackingSidebar from "@/components/packing/PackingSidebar";
import { PackagingOptimizationForm } from "@/components/packaging/PackagingOptimizationML";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const PackagingAIPrediction = () => {
  const navigate = useNavigate();
  const [packagingData, setPackagingData] = useState<any>(null);

  useEffect(() => {
    // Get packaging company data from localStorage
    const userData = localStorage.getItem("foodieSync_userData");
    const userType = localStorage.getItem("foodieSync_userType");
    
    if (!userData || userType !== "packing") {
      navigate("/login");
      return;
    }

    try {
      const parsedData = JSON.parse(userData);
      setPackagingData(parsedData);
    } catch (error) {
      console.error("Error parsing packaging data:", error);
      navigate("/login");
    }
  }, [navigate]);

  if (!packagingData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <PackingSidebar />
      
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header with back button */}
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => navigate("/packing-dashboard")}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                AI Packaging Optimization & Sustainability
              </h1>
              <p className="text-gray-600">
                Advanced machine learning model to optimize packaging choices with sustainability and cost analysis
              </p>
            </div>
          </div>

          {/* ML Model Component */}
          <PackagingOptimizationForm packagingCompanyId={packagingData.id} />
        </div>
      </div>
    </div>
  );
};

export default PackagingAIPrediction;
