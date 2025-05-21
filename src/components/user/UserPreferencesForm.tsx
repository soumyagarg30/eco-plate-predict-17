
import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

const userPreferencesSchema = z.object({
  favoriteFoods: z.string()
    .min(3, "Please enter at least one favorite food")
    .transform(val => val.split(',').map(item => item.trim()).filter(Boolean)),
  dietaryRestrictions: z.string()
    .optional()
    .transform(val => val ? val.split(',').map(item => item.trim()).filter(Boolean) : null),
  avgQuantityOrdered: z.string()
    .refine(val => !isNaN(Number(val)), {
      message: "Quantity must be a number",
    })
    .transform(val => val ? parseInt(val) : null),
  acPreference: z.boolean().default(false),
  familyMembers: z.string()
    .refine(val => !isNaN(Number(val)), {
      message: "Number of members must be a number",
    })
    .transform(val => val ? parseInt(val) : null),
});

type UserPreferencesValues = z.input<typeof userPreferencesSchema>;
type TransformedUserPreferencesValues = z.output<typeof userPreferencesSchema>;

interface UserPreferencesFormProps {
  userData: any;
  existingPreferences?: any;
  onSuccess?: () => void;
}

const UserPreferencesForm: React.FC<UserPreferencesFormProps> = ({
  userData,
  existingPreferences,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<UserPreferencesValues>({
    resolver: zodResolver(userPreferencesSchema),
    defaultValues: {
      favoriteFoods: existingPreferences?.favorite_foods?.join(', ') || '',
      dietaryRestrictions: existingPreferences?.dietary_restrictions?.join(', ') || '',
      avgQuantityOrdered: existingPreferences?.avg_quantity_ordered?.toString() || '',
      acPreference: existingPreferences?.ac_preference || false,
      familyMembers: existingPreferences?.family_members?.toString() || '',
    },
  });

  const onSubmit = async (values: UserPreferencesValues) => {
    if (!userData?.id) {
      toast({
        title: "Error",
        description: "User information not found",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const transformedValues = userPreferencesSchema.parse(values);
      
      if (existingPreferences?.id) {
        // Update existing preferences
        const { error } = await supabase
          .from('user_preferences')
          .update({
            favorite_foods: transformedValues.favoriteFoods,
            dietary_restrictions: transformedValues.dietaryRestrictions,
            avg_quantity_ordered: transformedValues.avgQuantityOrdered,
            ac_preference: transformedValues.acPreference,
            family_members: transformedValues.familyMembers,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingPreferences.id);

        if (error) throw error;
      } else {
        // Create new preferences
        const { error } = await supabase
          .from('user_preferences')
          .insert({
            user_id: userData.id,
            favorite_foods: transformedValues.favoriteFoods,
            dietary_restrictions: transformedValues.dietaryRestrictions,
            avg_quantity_ordered: transformedValues.avgQuantityOrdered,
            ac_preference: transformedValues.acPreference,
            family_members: transformedValues.familyMembers,
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Your preferences have been saved",
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        title: "Error",
        description: "Failed to save preferences",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="favoriteFoods"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Favorite Foods</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter your favorite foods (comma separated)"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                List your favorite foods, separated by commas
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dietaryRestrictions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dietary Restrictions</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter any dietary restrictions (comma separated)"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                List any dietary restrictions or allergies, separated by commas
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="avgQuantityOrdered"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Average Quantity Ordered</FormLabel>
                <FormControl>
                  <Input type="number" min="1" placeholder="Servings" {...field} />
                </FormControl>
                <FormDescription>
                  Typical number of servings you order
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="familyMembers"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Family Members</FormLabel>
                <FormControl>
                  <Input type="number" min="1" placeholder="Number of members" {...field} />
                </FormControl>
                <FormDescription>
                  Number of people in your family
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="acPreference"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>AC Preference</FormLabel>
                <FormDescription>
                  Do you prefer air-conditioned restaurants?
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Preferences"}
        </Button>
      </form>
    </Form>
  );
};

export default UserPreferencesForm;
