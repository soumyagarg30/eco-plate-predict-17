
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginTabContent from "./LoginTabContent";

export type UserTypes = "restaurant" | "user" | "ngo" | "packing" | "admin";

interface LoginTabsProps {
  userType: UserTypes;
  setUserType: (type: UserTypes) => void;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  isLoading: boolean;
  loginError: string;
  handleLogin: (e: React.FormEvent) => Promise<void>;
}

const LoginTabs: React.FC<LoginTabsProps> = ({
  userType,
  setUserType,
  email,
  setEmail,
  password,
  setPassword,
  isLoading,
  loginError,
  handleLogin,
}) => {
  return (
    <Tabs defaultValue={userType} onValueChange={(value) => setUserType(value as UserTypes)} className="w-full">
      <TabsList className="grid grid-cols-5 mb-4">
        <TabsTrigger value="restaurant">Restaurant</TabsTrigger>
        <TabsTrigger value="user">User</TabsTrigger>
        <TabsTrigger value="ngo">NGO</TabsTrigger>
        <TabsTrigger value="packing">Packing</TabsTrigger>
        <TabsTrigger value="admin">Admin</TabsTrigger>
      </TabsList>
      
      {["restaurant", "user", "ngo", "packing", "admin"].map((type) => (
        <TabsContent key={type} value={type}>
          <LoginTabContent
            type={type as UserTypes}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            isLoading={isLoading}
            handleLogin={handleLogin}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default LoginTabs;
