
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import NGOCard from "./NGOCard";
import { DB_TABLES } from "@/utils/dbUtils";

export interface NGO {
  id: number;
  name: string;
  contact: string;
  specialty: string | null;
  address?: string | null;
  email?: string | null;
  phone_number?: string | null; // Changed from number to string to match expected type
}

interface NGOConnectionsProps {
  restaurantId: number;
}

const NGOConnections = ({ restaurantId }: NGOConnectionsProps) => {
  const [ngos, setNgos] = useState<NGO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNGOs = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from(DB_TABLES.NGOS)
          .select('*')
          .order('name');

        if (error) throw error;

        // Map the data to match the NGO interface expected by NGOCard
        if (data) {
          const formattedData: NGO[] = data.map(ngo => ({
            id: ngo.id,
            name: ngo.name,
            contact: ngo.name, // Use name as contact since contact doesn't exist in DB
            specialty: null,   // This field doesn't exist in the DB
            address: ngo.address,
            email: ngo.email,
            phone_number: ngo.phone_number ? String(ngo.phone_number) : null // Convert to string
          }));
          setNgos(formattedData);
        }
      } catch (err) {
        console.error('Error fetching NGOs:', err);
        setError('Failed to load NGOs');
      } finally {
        setLoading(false);
      }
    };

    fetchNGOs();
  }, []);

  if (loading) {
    return <div className="p-4 text-center">Loading NGOs...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">NGO Partners</h2>
      
      {ngos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ngos.map(ngo => (
            <NGOCard 
              key={ngo.id} 
              ngo={ngo}
              restaurantId={restaurantId}
            />
          ))}
        </div>
      ) : (
        <div className="text-center p-6 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No NGOs found</p>
        </div>
      )}
    </div>
  );
};

export default NGOConnections;
