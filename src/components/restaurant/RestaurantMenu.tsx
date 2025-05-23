
import { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_vegetarian: boolean | null;
  is_vegan: boolean | null;
  carbon_footprint: number | null;
  is_available: boolean | null;
}

interface RestaurantMenuProps {
  restaurantId: number;
}

const RestaurantMenu = ({ restaurantId }: RestaurantMenuProps) => {
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<MenuItem>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchMenuItems();
  }, [restaurantId]);

  const fetchMenuItems = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('restaurant_menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('name');

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast({
        title: "Error",
        description: "Failed to load menu items",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = () => {
    setCurrentItem({
      name: '',
      description: '',
      price: 0,
      is_vegetarian: false,
      is_vegan: false,
      carbon_footprint: 0,
      is_available: true
    });
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const handleEditItem = (item: MenuItem) => {
    setCurrentItem(item);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('restaurant_menu_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchMenuItems();
      toast({
        title: "Item Deleted",
        description: "Menu item has been removed",
      });
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast({
        title: "Error",
        description: "Failed to delete menu item",
        variant: "destructive",
      });
    }
  };

  const handleSaveItem = async () => {
    if (!currentItem.name || !currentItem.price) {
      toast({
        title: "Error",
        description: "Name and price are required",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      if (isEditing && currentItem.id) {
        // Update existing item
        const { error } = await supabase
          .from('restaurant_menu_items')
          .update({
            name: currentItem.name,
            description: currentItem.description || null,
            price: currentItem.price,
            is_vegetarian: currentItem.is_vegetarian || false,
            is_vegan: currentItem.is_vegan || false,
            carbon_footprint: currentItem.carbon_footprint || 0,
            is_available: currentItem.is_available !== false
          })
          .eq('id', currentItem.id);

        if (error) throw error;

        toast({
          title: "Item Updated",
          description: "Menu item has been updated",
        });
      } else {
        // Add new item
        const { error } = await supabase
          .from('restaurant_menu_items')
          .insert({
            restaurant_id: restaurantId,
            name: currentItem.name,
            description: currentItem.description || null,
            price: currentItem.price,
            is_vegetarian: currentItem.is_vegetarian || false,
            is_vegan: currentItem.is_vegan || false,
            carbon_footprint: currentItem.carbon_footprint || 0,
            is_available: currentItem.is_available !== false
          });

        if (error) throw error;

        toast({
          title: "Item Added",
          description: "New menu item has been added",
        });
      }

      await fetchMenuItems();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast({
        title: "Error",
        description: "Failed to save menu item",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div>Loading menu items...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Restaurant Menu</h2>
        <Button onClick={handleAddItem} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" /> Add Menu Item
        </Button>
      </div>
      
      <div className="bg-green-50 p-4 rounded-lg mb-6 border border-green-200">
        <div className="flex items-start">
          <Star className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
          <div>
            <h3 className="font-medium text-gray-800">Sustainability Indicator</h3>
            <p className="text-sm text-gray-600">
              Items with lower carbon footprint and sustainable ingredients help create an eco-friendly menu.
            </p>
          </div>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Vegetarian</TableHead>
              <TableHead>Vegan</TableHead>
              <TableHead>Carbon Footprint</TableHead>
              <TableHead>Available</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {menuItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No menu items found. Add your first item to get started.
                </TableCell>
              </TableRow>
            ) : (
              menuItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-gray-600 max-w-xs truncate">
                    {item.description || 'No description'}
                  </TableCell>
                  <TableCell>${item.price.toFixed(2)}</TableCell>
                  <TableCell>
                    {item.is_vegetarian ? (
                      <span className="bg-green-100 text-green-800 text-xs px-2.5 py-0.5 rounded-full">Yes</span>
                    ) : (
                      <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-0.5 rounded-full">No</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.is_vegan ? (
                      <span className="bg-green-100 text-green-800 text-xs px-2.5 py-0.5 rounded-full">Yes</span>
                    ) : (
                      <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-0.5 rounded-full">No</span>
                    )}
                  </TableCell>
                  <TableCell>{item.carbon_footprint}kg CO₂</TableCell>
                  <TableCell>
                    {item.is_available ? (
                      <span className="bg-green-100 text-green-800 text-xs px-2.5 py-0.5 rounded-full">Available</span>
                    ) : (
                      <span className="bg-red-100 text-red-800 text-xs px-2.5 py-0.5 rounded-full">Unavailable</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEditItem(item)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteItem(item.id)}>
                      <Trash className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Menu Item' : 'Add New Menu Item'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Item Name</Label>
              <Input
                id="name"
                value={currentItem.name || ''}
                onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
                placeholder="Enter item name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={currentItem.description || ''}
                onChange={(e) => setCurrentItem({ ...currentItem, description: e.target.value })}
                placeholder="Describe the menu item"
                className="min-h-20"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={currentItem.price || ''}
                  onChange={(e) => setCurrentItem({ ...currentItem, price: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="carbon">Carbon Footprint (kg CO₂)</Label>
                <Input
                  id="carbon"
                  type="number"
                  step="0.1"
                  min="0"
                  value={currentItem.carbon_footprint || ''}
                  onChange={(e) => setCurrentItem({ ...currentItem, carbon_footprint: parseFloat(e.target.value) || 0 })}
                  placeholder="0.0"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="vegetarian"
                  checked={currentItem.is_vegetarian || false}
                  onCheckedChange={(checked) => 
                    setCurrentItem({ ...currentItem, is_vegetarian: checked as boolean })
                  }
                />
                <Label htmlFor="vegetarian" className="text-sm">Vegetarian</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="vegan"
                  checked={currentItem.is_vegan || false}
                  onCheckedChange={(checked) => 
                    setCurrentItem({ ...currentItem, is_vegan: checked as boolean })
                  }
                />
                <Label htmlFor="vegan" className="text-sm">Vegan</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="available"
                  checked={currentItem.is_available !== false}
                  onCheckedChange={(checked) => 
                    setCurrentItem({ ...currentItem, is_available: checked as boolean })
                  }
                />
                <Label htmlFor="available" className="text-sm">Available</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveItem} disabled={isSaving}>
              {isSaving ? 'Saving...' : (isEditing ? 'Update Item' : 'Add Item')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RestaurantMenu;
