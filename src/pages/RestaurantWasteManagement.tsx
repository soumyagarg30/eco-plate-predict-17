
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import RestaurantSidebar from "@/components/restaurant/RestaurantSidebar";
import { supabase } from "@/integrations/supabase/client";

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
  const [selectedNgo, setSelectedNgo] = useState("");
  const [foodDescription, setFoodDescription] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

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

  const handleSchedulePickup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (!selectedNgo || !foodDescription || quantity <= 0 || !dueDate) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Get the NGO id based on the selected name
      const selectedNgoData = ngoContacts.find(ngo => ngo.name === selectedNgo);
      
      if (!selectedNgoData) {
        throw new Error("Selected NGO not found");
      }
      
      // Create a new pickup request
      const { error } = await supabase
        .from("packing_requests")
        .insert({
          packing_company_id: restaurantData.id,
          requester_id: selectedNgoData.id,
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
      
      // Reset form
      setSelectedNgo("");
      setFoodDescription("");
      setQuantity(0);
      setDueDate("");
      setDialogOpen(false);
      
    } catch (error: any) {
      console.error("Error scheduling pickup:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to schedule pickup",
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
                      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" onClick={() => setSelectedNgo(ngo.name)}>Schedule Pickup</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Schedule Food Pickup with {selectedNgo}</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleSchedulePickup} className="space-y-4 pt-4">
                            <div className="space-y-2">
                              <Label htmlFor="food-description">Food Description</Label>
                              <Textarea 
                                id="food-description" 
                                placeholder="Describe the food items you want to donate"
                                value={foodDescription}
                                onChange={(e) => setFoodDescription(e.target.value)}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="quantity">Quantity (servings)</Label>
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
                              <Label htmlFor="due-date">Pickup Date</Label>
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
                                {isSubmitting ? "Scheduling..." : "Schedule Pickup"}
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
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
