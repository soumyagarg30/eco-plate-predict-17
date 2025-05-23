
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import NGOCard from './NGOCard';
import PickupForm, { PickupFormData } from './PickupForm';
import { Dialog } from "@/components/ui/dialog";

export interface NGO {
  id: number;
  name: string;
  contact: string;
  specialty: string;
}

interface NGOConnectionsProps {
  ngoContacts: NGO[];
  onSchedulePickup: (ngoId: number, formData: PickupFormData) => Promise<void>;
}

const NGOConnections: React.FC<NGOConnectionsProps> = ({ ngoContacts, onSchedulePickup }) => {
  const [selectedNgo, setSelectedNgo] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleNGOClick = (ngoName: string) => {
    setSelectedNgo(ngoName);
  };
  
  const handleSubmit = async (formData: PickupFormData) => {
    setIsSubmitting(true);
    try {
      const selectedNgoData = ngoContacts.find(ngo => ngo.name === selectedNgo);
      if (!selectedNgoData) {
        throw new Error("Selected NGO not found");
      }
      
      await onSchedulePickup(selectedNgoData.id, formData);
      
      // Reset form
      setSelectedNgo("");
      setDialogOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>NGO Connections</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {ngoContacts.map((ngo) => (
            <NGOCard
              key={ngo.id}
              ngo={ngo}
              onContact={() => console.log(`Contact ${ngo.name}`)}
              onSchedulePickup={() => handleNGOClick(ngo.name)}
              isSelected={dialogOpen && selectedNgo === ngo.name}
              setDialogOpen={setDialogOpen}
            />
          ))}
          
          <Button className="w-full" variant="outline">Find More NGO Partners</Button>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <PickupForm 
              selectedNgo={selectedNgo} 
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
            />
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default NGOConnections;
