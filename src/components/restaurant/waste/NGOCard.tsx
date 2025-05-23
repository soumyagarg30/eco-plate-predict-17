
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Phone, Mail } from "lucide-react";
import PickupForm from './PickupForm';
import { NGO } from './NGOConnections';

interface NGOCardProps {
  ngo: NGO;
  restaurantId: number;
}

const NGOCard: React.FC<NGOCardProps> = ({ 
  ngo, 
  restaurantId 
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const handleContactClick = () => {
    if (ngo.email) {
      window.location.href = `mailto:${ngo.email}`;
    } else {
      window.location.href = `mailto:${ngo.contact}`;
    }
  };
  
  const handleSchedulePickup = () => {
    // Logic for scheduling pickup can be added here if needed
    console.log('Scheduling pickup with:', ngo.name);
  };
  
  return (
    <div className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-all">
      <h3 className="font-medium text-gray-900">{ngo.name}</h3>
      <p className="text-gray-600">{ngo.specialty || 'General food donations'}</p>
      
      <div className="mt-1 text-sm text-gray-500 flex items-center gap-2">
        <Mail className="h-3.5 w-3.5" />
        <span>{ngo.contact}</span>
      </div>
      
      {ngo.phone_number && (
        <div className="mt-1 text-sm text-gray-500 flex items-center gap-2">
          <Phone className="h-3.5 w-3.5" />
          <span>{ngo.phone_number}</span>
        </div>
      )}
      
      <div className="mt-3 flex space-x-2">
        <Button variant="outline" size="sm" onClick={handleContactClick}>
          Contact
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={handleSchedulePickup}>Schedule Pickup</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <PickupForm 
              ngo={ngo} 
              restaurantId={restaurantId} 
              onSuccess={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default NGOCard;
