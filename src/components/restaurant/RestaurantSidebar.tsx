
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Home, Menu as MenuIcon, Trash2, Package, ChefHat, LogOut } from "lucide-react";

type RestaurantSidebarProps = {
  restaurantName: string;
};

const RestaurantSidebar = ({ restaurantName }: RestaurantSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    // Clear local storage
    localStorage.removeItem("foodieSync_userType");
    localStorage.removeItem("foodieSync_userData");
    
    // Show toast
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    });
    
    // Redirect to home page
    navigate("/");
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className={`bg-white border-r border-gray-200 h-screen flex flex-col ${isCollapsed ? 'w-20' : 'w-64'} transition-all duration-300`}>
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Avatar className="h-10 w-10 bg-gray-200 text-gray-800">
              <AvatarFallback>{getInitials(restaurantName)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-semibold text-sm truncate max-w-[180px] text-gray-900">{restaurantName}</span>
              <span className="text-xs text-gray-500">Restaurant</span>
            </div>
          </div>
        )}
        {isCollapsed && (
          <Avatar className="h-10 w-10 mx-auto bg-gray-200 text-gray-800">
            <AvatarFallback>{getInitials(restaurantName)}</AvatarFallback>
          </Avatar>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-gray-500 hover:text-gray-700"
        >
          {isCollapsed ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="13 17 18 12 13 7"></polyline>
              <polyline points="6 17 11 12 6 7"></polyline>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="11 17 6 12 11 7"></polyline>
              <polyline points="18 17 13 12 18 7"></polyline>
            </svg>
          )}
        </button>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          <li>
            <Link
              to="/restaurant-dashboard"
              className={`flex items-center p-3 rounded-lg ${isActive('/restaurant-dashboard') ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <Home className="w-5 h-5" />
              {!isCollapsed && <span className="ml-3 font-medium">Dashboard</span>}
            </Link>
          </li>
          <li>
            <Link
              to="/restaurant-dashboard?tab=menu"
              className={`flex items-center p-3 rounded-lg ${location.pathname === "/restaurant-dashboard" && location.search.includes("tab=menu") ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <MenuIcon className="w-5 h-5" />
              {!isCollapsed && <span className="ml-3 font-medium">Menu</span>}
            </Link>
          </li>
          <li>
            <Link
              to="/restaurant-waste-management"
              className={`flex items-center p-3 rounded-lg ${isActive('/restaurant-waste-management') ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <Trash2 className="w-5 h-5" />
              {!isCollapsed && <span className="ml-3 font-medium">Food Waste Management</span>}
            </Link>
          </li>
          <li>
            <Link
              to="/restaurant-food-preparation"
              className={`flex items-center p-3 rounded-lg ${isActive('/restaurant-food-preparation') ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <ChefHat className="w-5 h-5" />
              {!isCollapsed && <span className="ml-3 font-medium">Food Preparation</span>}
            </Link>
          </li>
          <li>
            <Link
              to="/restaurant-packaging"
              className={`flex items-center p-3 rounded-lg ${isActive('/restaurant-packaging') ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <Package className="w-5 h-5" />
              {!isCollapsed && <span className="ml-3 font-medium">Sustainable Packaging</span>}
            </Link>
          </li>
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="outline"
          className={`w-full justify-center text-gray-700 ${isCollapsed ? 'px-2' : ''}`}
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span className="ml-2">Logout</span>}
        </Button>
      </div>
    </div>
  );
};

export default RestaurantSidebar;
