
import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";

const ratingFormSchema = z.object({
  rating: z.number().min(1).max(5),
  review: z.string().optional(),
});

type RatingFormValues = z.infer<typeof ratingFormSchema>;

interface RestaurantRatingFormProps {
  userData: any;
  restaurant: any;
  onSuccess?: () => void;
  existingRating?: any;
}

const RestaurantRatingForm: React.FC<RestaurantRatingFormProps> = ({
  userData,
  restaurant,
  onSuccess,
  existingRating,
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [hoveredRating, setHoveredRating] = React.useState(0);

  const form = useForm<RatingFormValues>({
    resolver: zodResolver(ratingFormSchema),
    defaultValues: {
      rating: existingRating?.rating || 0,
      review: existingRating?.review || "",
    },
  });

  const { setValue, watch } = form;
  const currentRating = watch("rating");

  const onSubmit = async (values: RatingFormValues) => {
    if (!userData?.id || !restaurant?.id) {
      toast({
        title: "Error",
        description: "User or restaurant information is missing",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("Submitting rating with data:", {
        user_id: userData.id,
        restaurant_id: restaurant.id,
        rating: values.rating,
        review: values.review || null,
      });

      if (existingRating?.id) {
        // Update existing rating
        const { error } = await supabase
          .from('restaurant_ratings')
          .update({
            rating: values.rating,
            review: values.review || null,
          })
          .eq('id', existingRating.id);

        if (error) {
          console.error("Update error:", error);
          throw error;
        }
      } else {
        // Create new rating - using direct insert without RLS dependency
        const { error } = await supabase
          .from('restaurant_ratings')
          .insert({
            user_id: userData.id,
            restaurant_id: restaurant.id,
            rating: values.rating,
            review: values.review || null,
          });

        if (error) {
          console.error("Insert error:", error);
          throw error;
        }
      }

      toast({
        title: "Thank you for your feedback!",
        description: "Your rating has been saved successfully.",
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error saving rating:", error);
      toast({
        title: "Error",
        description: "Failed to save your rating. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <FormLabel>Rating</FormLabel>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => setValue("rating", rating)}
                onMouseEnter={() => setHoveredRating(rating)}
                onMouseLeave={() => setHoveredRating(0)}
                className="focus:outline-none p-1"
              >
                <Star
                  className={`h-6 w-6 ${
                    (hoveredRating ? rating <= hoveredRating : rating <= currentRating)
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>
          {form.formState.errors.rating && (
            <p className="text-sm font-medium text-destructive">
              Please select a rating
            </p>
          )}
        </div>

        <FormField
          control={form.control}
          name="review"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Review (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Share your experience with this restaurant"
                  className="min-h-24"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || currentRating === 0}
        >
          {isSubmitting ? "Submitting..." : existingRating ? "Update Rating" : "Submit Rating"}
        </Button>
      </form>
    </Form>
  );
};

export default RestaurantRatingForm;
