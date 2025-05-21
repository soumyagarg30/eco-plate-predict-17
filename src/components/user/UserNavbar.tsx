
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Search, Bell, User as UserIcon, LogOut } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Avatar } from "@/components/ui/avatar";

interface UserNavbarProps {
  userName: string;
}

const UserNavbar = ({ userName }: UserNavbarProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem("foodieSync_userType");
    localStorage.removeItem("foodieSync_userData");
    
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
    
    navigate("/login");
  };

  return (
    <nav className="bg-white border-b border-gray-200 py-3 px-6 shadow-sm">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/user-dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-foodie-green flex items-center justify-center">
            <span className="text-white text-lg font-bold">F</span>
          </div>
          <span className="text-xl font-bold text-foodie-green-dark">FoodieSync</span>
        </Link>

        {/* Search Bar for Desktop */}
        <div className="hidden md:flex items-center w-1/3">
          <div className="relative w-full">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search restaurants..."
              className="pl-8 pr-4 py-2 border-foodie-green-dark/20 focus:border-foodie-yellow"
            />
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          <Button variant="ghost" className="text-gray-600 hover:text-foodie-green-dark">
            <Bell className="h-5 w-5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 text-gray-600 hover:text-foodie-green-dark">
                <Avatar className="h-8 w-8">
                  <div className="bg-foodie-green text-white w-full h-full flex items-center justify-center">
                    {userName.charAt(0)}
                  </div>
                </Avatar>
                <span className="text-sm font-medium">{userName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/user-profile")}>
                <UserIcon className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-red-500" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Menu Button */}
        <button onClick={toggleMenu} className="md:hidden text-gray-600">
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden pt-4 pb-4 px-6 bg-white">
          <div className="mb-4">
            <div className="relative w-full">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search restaurants..."
                className="pl-8 pr-4 py-2 border-foodie-green-dark/20 focus:border-foodie-yellow"
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            <Button 
              variant="ghost" 
              className="flex justify-start items-center gap-2 text-gray-600"
              onClick={() => navigate("/user-profile")}
            >
              <UserIcon className="h-4 w-4" />
              Profile
            </Button>
            
            <Button 
              variant="ghost" 
              className="flex justify-start items-center gap-2 text-gray-600"
            >
              <Bell className="h-4 w-4" />
              Notifications
            </Button>
            
            <Button 
              variant="ghost" 
              className="flex justify-start items-center gap-2 text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default UserNavbar;
