
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface NGORequest {
  id: string;
  request_title: string;
  request_description: string;
  quantity: number;
  status: string;
  due_date: string;
  restaurant_id: number;
  created_at: string;
  restaurant_name?: string;
}

interface NGORequestHistoryProps {
  ngoId: number;
}

const NGORequestHistory = ({ ngoId }: NGORequestHistoryProps) => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<NGORequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching requests for NGO ID:", ngoId);

        const { data: requestsData, error } = await supabase
          .from("ngo_food_requests")
          .select("*")
          .eq("ngo_id", ngoId)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching NGO requests:", error);
          throw error;
        }

        console.log("NGO requests found:", requestsData);

        if (requestsData && requestsData.length > 0) {
          // Fetch restaurant names for each request
          const requestsWithRestaurantNames = await Promise.all(
            requestsData.map(async (request) => {
              const { data: restaurantData } = await supabase
                .from("Restaurants_Details")
                .select("restaurant_name")
                .eq("id", request.restaurant_id)
                .single();

              return {
                ...request,
                restaurant_name: restaurantData?.restaurant_name || "Unknown Restaurant",
              };
            })
          );

          setRequests(requestsWithRestaurantNames);
        } else {
          setRequests([]);
        }
      } catch (error) {
        console.error("Error fetching requests:", error);
        toast({
          title: "Error",
          description: "Failed to load request history",
          variant: "destructive",
        });
        setRequests([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, [ngoId, toast]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "accepted":
        return <CheckCircle className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "accepted":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "completed":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "rejected":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-gray-500">Loading request history...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request History</CardTitle>
        <CardDescription>
          Track the status of your food requests to restaurants
        </CardDescription>
      </CardHeader>
      <CardContent>
        {requests.length > 0 ? (
          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Restaurant</TableHead>
                  <TableHead>Request</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Needed By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {request.restaurant_name}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{request.request_title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {request.request_description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{request.quantity} servings</TableCell>
                    <TableCell>{formatDate(request.due_date)}</TableCell>
                    <TableCell>
                      <Badge className={`flex items-center gap-1 ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(request.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center p-10 border rounded-md bg-gray-50">
            <Clock className="mx-auto h-10 w-10 text-gray-400 mb-4" />
            <p className="text-gray-500 mb-2">No food requests submitted yet</p>
            <p className="text-sm text-gray-400">
              Submit your first food request using the "Food Requests" tab
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NGORequestHistory;
