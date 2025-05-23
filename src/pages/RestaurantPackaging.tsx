
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import RestaurantSidebar from "@/components/restaurant/RestaurantSidebar";
import { supabase } from "@/integrations/supabase/client";

const RestaurantPackaging = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [restaurantData, setRestaurantData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [requestTitle, setRequestTitle] = useState("");
  const [requestDescription, setRequestDescription] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [dueDate, setDueDate] = useState("");
  
  // Sample packaging suppliers data
  const [suppliers, setSuppliers] = useState([
    { 
      id: 1, 
      name: "EcoPackage Solutions", 
      materials: "Plant-based compostable", 
      carbonFootprint: "Low", 
      costPerUnit: "$0.25",
      rating: 5
    },
    { 
      id: 2, 
      name: "GreenContainer Co", 
      materials: "Recycled paper products", 
      carbonFootprint: "Medium-Low", 
      costPerUnit: "$0.18",
      rating: 4
    },
    { 
      id: 3, 
      name: "Sustainable Food Packaging", 
      materials: "Bamboo and sugarcane", 
      carbonFootprint: "Low", 
      costPerUnit: "$0.32",
      rating: 5
    },
    { 
      id: 4, 
      name: "EarthWise Containers", 
      materials: "Biodegradable plastics", 
      carbonFootprint: "Medium", 
      costPerUnit: "$0.15",
      rating: 3
    },
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

  const handleContactSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (!selectedSupplier || !requestTitle || !requestDescription || quantity <= 0 || !dueDate) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Get the supplier id based on the selected name
      const selectedSupplierData = suppliers.find(supplier => supplier.name === selectedSupplier);
      
      if (!selectedSupplierData) {
        throw new Error("Selected supplier not found");
      }
      
      // Create a new packaging request
      const { error } = await supabase
        .from("packing_requests")
        .insert({
          packing_company_id: selectedSupplierData.id,
          requester_id: restaurantData.id,
          requester_type: "restaurant",
          request_title: requestTitle,
          request_description: requestDescription,
          quantity: quantity,
          due_date: dueDate,
          status: "pending"
        });
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Packaging request sent successfully",
      });
      
      // Reset form
      setRequestTitle("");
      setRequestDescription("");
      setQuantity(0);
      setDueDate("");
      setDialogOpen(false);
      
    } catch (error: any) {
      console.error("Error sending packaging request:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send packaging request",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
      <RestaurantSidebar restaurantName={restaurantData.restaurant_name} />
      
      <div className="flex-1 p-6 md:p-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sustainable Packaging</h1>
          <p className="text-gray-600">
            Find packaging solutions with the lowest carbon footprint
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recommended Sustainable Suppliers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {suppliers.map((supplier) => (
                  <div key={supplier.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{supplier.name}</h3>
                        <p className="text-gray-600">Materials: {supplier.materials}</p>
                        <p className="text-gray-600">Carbon Footprint: {supplier.carbonFootprint}</p>
                        <p className="text-gray-600">Cost: {supplier.costPerUnit} per unit</p>
                      </div>
                      <div className="flex items-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span 
                            key={i}
                            className={`material-icons text-sm ${i < supplier.rating ? 'text-amber-500' : 'text-gray-300'}`}
                          >
                            star
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 flex space-x-2">
                      <Button variant="outline" size="sm">View Catalog</Button>
                      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" onClick={() => setSelectedSupplier(supplier.name)}>Contact Supplier</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Request from {selectedSupplier}</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleContactSupplier} className="space-y-4 pt-4">
                            <div className="space-y-2">
                              <Label htmlFor="request-title">Request Title</Label>
                              <Input
                                id="request-title"
                                placeholder="E.g., Biodegradable Containers Order"
                                value={requestTitle}
                                onChange={(e) => setRequestTitle(e.target.value)}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="request-description">Request Details</Label>
                              <Textarea
                                id="request-description"
                                placeholder="Describe what packaging you need"
                                value={requestDescription}
                                onChange={(e) => setRequestDescription(e.target.value)}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="quantity">Quantity</Label>
                              <Input
                                id="quantity"
                                type="number"
                                min="1"
                                value={quantity || ""}
                                onChange={(e) => setQuantity(parseInt(e.target.value))}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="due-date">Needed By</Label>
                              <Input
                                id="due-date"
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                required
                              />
                            </div>
                            <DialogFooter>
                              <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Sending..." : "Send Request"}
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Carbon Footprint Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gray-100 rounded-lg">
                  <h3 className="font-medium text-gray-900">Current Packaging Impact</h3>
                  <p className="text-gray-600">Current monthly CO2 equivalent: 235kg</p>
                  <p className="text-gray-600">Industry average for your size: 310kg</p>
                  <p className="text-gray-600 font-medium">You're doing 24% better than average!</p>
                </div>
                
                <div className="p-4 bg-gray-100 rounded-lg">
                  <h3 className="font-medium text-gray-900">Improvement Recommendations</h3>
                  <ul className="list-disc pl-5 text-gray-600 space-y-1">
                    <li>Switch takeout containers to compostable alternatives</li>
                    <li>Replace plastic straws with paper or reusable options</li>
                    <li>Implement a container return program for regular customers</li>
                    <li>Use stamps instead of printed receipts where possible</li>
                  </ul>
                </div>
                
                <div className="flex justify-end">
                  <Button>Generate Full Report</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RestaurantPackaging;
