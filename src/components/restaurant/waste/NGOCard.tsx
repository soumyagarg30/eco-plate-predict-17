
import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";

interface NGO {
  id: number;
  name: string;
  contact: string;
  specialty: string;
}

interface NGOCardProps {
  ngo: NGO;
  onContact: () => void;
  onSchedulePickup: () => void;
  isSelected: boolean;
  setDialogOpen: (isOpen: boolean) => void;
}

const NGOCard: React.FC<NGOCardProps> = ({ 
  ngo, 
  onContact, 
  onSchedulePickup, 
  isSelected,
  setDialogOpen
}) => {
  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <h3 className="font-medium text-gray-900">{ngo.name}</h3>
      <p className="text-gray-600">{ngo.specialty}</p>
      <p className="text-gray-600">{ngo.contact}</p>
      <div className="mt-2 flex space-x-2">
        <Button variant="outline" size="sm" onClick={onContact}>Contact</Button>
        <Dialog open={isSelected} onOpenChange={(open) => {
          setDialogOpen(open);
          if (open) onSchedulePickup();
        }}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={onSchedulePickup}>Schedule Pickup</Button>
          </DialogTrigger>
        </Dialog>
      </div>
    </div>
  );
};

export default NGOCard;
