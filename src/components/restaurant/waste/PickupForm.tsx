
import React, { useState } from 'react';
import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface PickupFormProps {
  restaurantId: number;
  onSuccess: () => void;
}

export interface PickupFormData {
  foodDescription: string;
  quantity: number;
  dueDate: string;
}

const PickupForm: React.FC<PickupFormProps> = ({ restaurantId, onSuccess }) => {
  const [foodDescription, setFoodDescription] = useState('');
  const [quantity, setQuantity] = useState<number>(0);
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // TODO: Implement the actual submission logic to save pickup request
    console.log('Pickup form submitted:', {
      restaurantId,
      foodDescription,
      quantity,
      dueDate
    });
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSubmitting(false);
    onSuccess();
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Schedule Food Pickup</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
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
  );
};

export default PickupForm;
