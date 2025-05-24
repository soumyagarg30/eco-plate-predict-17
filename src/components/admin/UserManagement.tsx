
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface User {
  id: number;
  name?: string;
  username?: string;
  restaurant_name?: string;
  email: string;
  phone_number?: string | number;
  verified: boolean;
  created_at: string;
  type: 'restaurant' | 'user' | 'ngo' | 'packing';
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      // Fetch all user types
      const [restaurants, regularUsers, ngos, packingCompanies] = await Promise.all([
        supabase.from('Restaurants_Details').select('*'),
        supabase.from('User_Details').select('*'),
        supabase.from("Ngo's").select('*'),
        supabase.from('Packing_Companies').select('*')
      ]);

      const allUsers: User[] = [
        ...(restaurants.data || []).map(user => ({ ...user, type: 'restaurant' as const })),
        ...(regularUsers.data || []).map(user => ({ ...user, type: 'user' as const })),
        ...(ngos.data || []).map(user => ({ ...user, type: 'ngo' as const })),
        ...(packingCompanies.data || []).map(user => ({ ...user, type: 'packing' as const }))
      ];

      setUsers(allUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleVerification = async (userId: number, userType: string, currentStatus: boolean) => {
    try {
      const tableName = getTableName(userType);
      const { error } = await supabase
        .from(tableName)
        .update({ verified: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `User ${!currentStatus ? 'verified' : 'unverified'} successfully`,
      });

      fetchAllUsers();
    } catch (error) {
      console.error('Error updating verification:', error);
      toast({
        title: "Error",
        description: "Failed to update verification status",
        variant: "destructive",
      });
    }
  };

  const getTableName = (userType: string) => {
    switch (userType) {
      case 'restaurant':
        return 'Restaurants_Details';
      case 'user':
        return 'User_Details';
      case 'ngo':
        return "Ngo's";
      case 'packing':
        return 'Packing_Companies';
      default:
        return '';
    }
  };

  const getUserDisplayName = (user: User) => {
    return user.name || user.username || user.restaurant_name || 'N/A';
  };

  const getUserTypeLabel = (type: string) => {
    switch (type) {
      case 'restaurant':
        return 'Restaurant';
      case 'user':
        return 'Regular User';
      case 'ngo':
        return 'NGO';
      case 'packing':
        return 'Packing Company';
      default:
        return type;
    }
  };

  const filterUsersByType = (type: string) => {
    return users.filter(user => user.type === type);
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const UserTable = ({ filteredUsers }: { filteredUsers: User[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredUsers.map((user) => (
          <TableRow key={`${user.type}-${user.id}`}>
            <TableCell className="font-medium">
              {getUserDisplayName(user)}
            </TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.phone_number || 'N/A'}</TableCell>
            <TableCell>
              <Badge variant={user.verified ? "default" : "secondary"}>
                {user.verified ? "Verified" : "Pending"}
              </Badge>
            </TableCell>
            <TableCell>
              {new Date(user.created_at).toLocaleDateString()}
            </TableCell>
            <TableCell>
              <Button
                variant={user.verified ? "outline" : "default"}
                size="sm"
                onClick={() => toggleVerification(user.id, user.type, user.verified)}
              >
                {user.verified ? "Unverify" : "Verify"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading users...</div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All ({users.length})</TabsTrigger>
            <TabsTrigger value="restaurant">Restaurants ({filterUsersByType('restaurant').length})</TabsTrigger>
            <TabsTrigger value="user">Users ({filterUsersByType('user').length})</TabsTrigger>
            <TabsTrigger value="ngo">NGOs ({filterUsersByType('ngo').length})</TabsTrigger>
            <TabsTrigger value="packing">Packing ({filterUsersByType('packing').length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <UserTable filteredUsers={users} />
          </TabsContent>
          
          <TabsContent value="restaurant">
            <UserTable filteredUsers={filterUsersByType('restaurant')} />
          </TabsContent>
          
          <TabsContent value="user">
            <UserTable filteredUsers={filterUsersByType('user')} />
          </TabsContent>
          
          <TabsContent value="ngo">
            <UserTable filteredUsers={filterUsersByType('ngo')} />
          </TabsContent>
          
          <TabsContent value="packing">
            <UserTable filteredUsers={filterUsersByType('packing')} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default UserManagement;
