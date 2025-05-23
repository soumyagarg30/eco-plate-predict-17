
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Edit, Save, X } from "lucide-react";

interface RestaurantDetailsProps {
  restaurantId: number;
  restaurantData: any;
  onUpdate: (data: any) => void;
}

const RestaurantDetails = ({ restaurantId, restaurantData, onUpdate }: RestaurantDetailsProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    restaurant_name: '',
    email: '',
    phone_number: '',
    address: ''
  });

  useEffect(() => {
    if (restaurantData) {
      setFormData({
        restaurant_name: restaurantData.restaurant_name || '',
        email: restaurantData.email || '',
        phone_number: restaurantData.phone_number?.toString() || '',
        address: restaurantData.address || ''
      });
    }
  }, [restaurantData]);

  const handleSave = async () => {
    if (!formData.restaurant_name || !formData.email) {
      toast({
        title: "Error",
        description: "Restaurant name and email are required",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const updateData: any = {
        restaurant_name: formData.restaurant_name,
        email: formData.email,
        address: formData.address || null
      };

      // Only include phone_number if it's provided and valid
      if (formData.phone_number && formData.phone_number.trim()) {
        const phoneNumber = parseInt(formData.phone_number);
        if (!isNaN(phoneNumber)) {
          updateData.phone_number = phoneNumber;
        }
      }

      const { data, error } = await supabase
        .from('Restaurants_Details')
        .update(updateData)
        .eq('id', restaurantId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Restaurant details updated successfully",
      });

      onUpdate(data);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating restaurant details:', error);
      toast({
        title: "Error",
        description: "Failed to update restaurant details",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    if (restaurantData) {
      setFormData({
        restaurant_name: restaurantData.restaurant_name || '',
        email: restaurantData.email || '',
        phone_number: restaurantData.phone_number?.toString() || '',
        address: restaurantData.address || ''
      });
    }
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Restaurant Details</CardTitle>
          {!isEditing ? (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCancel}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <>
            <div className="grid gap-2">
              <Label htmlFor="restaurant_name">Restaurant Name</Label>
              <Input
                id="restaurant_name"
                value={formData.restaurant_name}
                onChange={(e) => setFormData({ ...formData, restaurant_name: e.target.value })}
                placeholder="Enter restaurant name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter restaurant address"
                className="min-h-20"
              />
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium text-gray-600">Restaurant Name</Label>
              <p className="text-gray-900">{restaurantData?.restaurant_name || 'Not provided'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Email</Label>
              <p className="text-gray-900">{restaurantData?.email || 'Not provided'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Phone Number</Label>
              <p className="text-gray-900">{restaurantData?.phone_number || 'Not provided'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Address</Label>
              <p className="text-gray-900">{restaurantData?.address || 'Not provided'}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RestaurantDetails;
