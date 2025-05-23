
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const formSchema = z.object({
  requestTitle: z.string().min(5, "Title must be at least 5 characters"),
  requestDescription: z.string().min(10, "Description must be at least 10 characters"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  dueDate: z.date({
    required_error: "Due date is required",
  }).refine(date => date > new Date(), {
    message: "Due date must be in the future",
  }),
});

type FoodRequestFormValues = z.infer<typeof formSchema>;

interface FoodRequestFormProps {
  ngoId: number;
  onSuccess?: () => void;
}

const FoodRequestForm = ({ ngoId, onSuccess }: FoodRequestFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FoodRequestFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      requestTitle: "",
      requestDescription: "",
      quantity: 10,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    },
  });

  const onSubmit = async (data: FoodRequestFormValues) => {
    setIsSubmitting(true);

    try {
      console.log("Submitting food request with NGO ID:", ngoId);
      
      // Get list of restaurants to select a recipient randomly (for demonstration)
      const { data: restaurants, error: restaurantsError } = await supabase
        .from("Restaurants_Details")
        .select("id")
        .limit(10);

      if (restaurantsError) {
        console.error("Error fetching restaurants:", restaurantsError);
        throw restaurantsError;
      }

      if (!restaurants || restaurants.length === 0) {
        toast({
          title: "Error",
          description: "No restaurants found in the system",
          variant: "destructive",
        });
        return;
      }

      // Select a random restaurant
      const randomRestaurant = restaurants[Math.floor(Math.random() * restaurants.length)];
      console.log("Selected restaurant:", randomRestaurant);

      // Create food request in the ngo_food_requests table
      const { error } = await supabase
        .from("ngo_food_requests")
        .insert({
          ngo_id: ngoId,
          restaurant_id: randomRestaurant.id,
          request_title: data.requestTitle,
          request_description: data.requestDescription,
          quantity: data.quantity,
          due_date: data.dueDate.toISOString(),
          status: "pending",
        });

      if (error) {
        console.error("Error creating food request:", error);
        throw error;
      }

      console.log("Food request created successfully");

      toast({
        title: "Success",
        description: "Food request submitted successfully",
      });

      // Reset form
      form.reset();

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error submitting food request:", error);
      toast({
        title: "Error",
        description: "Failed to submit food request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border shadow">
      <CardHeader>
        <CardTitle>Create Food Request</CardTitle>
        <CardDescription>
          Submit a request for food donations from restaurants
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="requestTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Request Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Urgent food needed for 50 homeless people" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requestDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Request Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Provide details about your request and how it will help..." 
                      className="resize-none min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity Needed (servings)</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Needed By</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="bg-muted/50 border-t flex justify-between text-xs text-muted-foreground">
        <p>All requests are reviewed by restaurants before approval</p>
      </CardFooter>
    </Card>
  );
};

export default FoodRequestForm;
