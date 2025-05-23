
import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Phone, Mail } from "lucide-react";

interface NGO {
  id: number;
  name: string;
  contact: string;
  specialty: string | null;
  email?: string | null;
  phone_number?: string | null;
}

interface NGOCardProps {
  ngo: NGO;
  onSchedulePickup: () => void;
  isSelected: boolean;
  setDialogOpen: (isOpen: boolean) => void;
}

const NGOCard: React.FC<NGOCardProps> = ({ 
  ngo, 
  onSchedulePickup, 
  isSelected,
  setDialogOpen
}) => {
  const handleContactClick = () => {
    if (ngo.email) {
      window.location.href = `mailto:${ngo.email}`;
    } else {
      window.location.href = `mailto:${ngo.contact}`;
    }
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
        <Dialog open={isSelected} onOpenChange={(open) => {
          setDialogOpen(open);
          if (open) onSchedulePickup();
        }}>
          <DialogTrigger asChild>
            <Button size="sm">Schedule Pickup</Button>
          </DialogTrigger>
        </Dialog>
      </div>
    </div>
  );
};

export default NGOCard;
