
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
  specialty: string | null;
}

interface NGOConnectionsProps {
  ngoContacts: NGO[];
  onSchedulePickup: (ngoId: number, formData: PickupFormData) => Promise<void>;
}

const NGOConnections: React.FC<NGOConnectionsProps> = ({ ngoContacts, onSchedulePickup }) => {
  const [selectedNgo, setSelectedNgo] = useState<NGO | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleNGOClick = (ngo: NGO) => {
    setSelectedNgo(ngo);
    setDialogOpen(true);
  };
  
  const handleSubmit = async (formData: PickupFormData) => {
    setIsSubmitting(true);
    try {
      if (!selectedNgo) {
        throw new Error("No NGO selected");
      }
      
      await onSchedulePickup(selectedNgo.id, formData);
      
      // Reset form
      setSelectedNgo(null);
      setDialogOpen(false);
    } catch (error) {
      console.error("Error submitting form:", error);
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
          {ngoContacts.length > 0 ? (
            ngoContacts.map((ngo) => (
              <NGOCard
                key={ngo.id}
                ngo={ngo}
                onSchedulePickup={() => handleNGOClick(ngo)}
                isSelected={dialogOpen && selectedNgo?.id === ngo.id}
                setDialogOpen={setDialogOpen}
              />
            ))
          ) : (
            <div className="text-center p-6 bg-gray-50 rounded-md">
              <p className="text-gray-500">No NGO partners found</p>
            </div>
          )}
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            {selectedNgo && (
              <PickupForm 
                selectedNgo={selectedNgo.name} 
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
              />
            )}
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default NGOConnections;
