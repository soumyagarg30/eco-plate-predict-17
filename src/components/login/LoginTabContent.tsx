
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent, CardFooter } from "@/components/ui/card";
import { UserTypes } from "./LoginTabs";

interface LoginTabContentProps {
  type: UserTypes;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  isLoading: boolean;
  handleLogin: (e: React.FormEvent) => Promise<void>;
}

const LoginTabContent: React.FC<LoginTabContentProps> = ({
  type,
  email,
  setEmail,
  password,
  setPassword,
  isLoading,
  handleLogin,
}) => {
  return (
    <>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`${type}-email`}>Email</Label>
            <Input 
              id={`${type}-email`} 
              type="email" 
              placeholder="your@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor={`${type}-password`}>Password</Label>
              <Link to="/forgot-password" className="text-sm text-foodie-yellow hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input 
              id={`${type}-password`} 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-foodie-yellow hover:bg-foodie-yellow-dark text-black"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </CardContent>
      
      <CardFooter className="flex flex-col">
        <div className="text-sm text-center">
          Don't have an account?{" "}
          <Link 
            to={`/${type === "restaurant" ? "register" : `${type}-register`}`}
            className="text-foodie-yellow hover:underline"
          >
            Register
          </Link>
        </div>
      </CardFooter>
    </>
  );
};

export default LoginTabContent;
