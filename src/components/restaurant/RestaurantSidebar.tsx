import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

type RestaurantSidebarProps = {
  restaurantName: string;
};

const RestaurantSidebar = ({ restaurantName }: RestaurantSidebarProps) => {
  const navigate = useNavigate();
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

  return (
    <div className={`bg-white border-r border-gray-200 h-screen flex flex-col ${isCollapsed ? 'w-20' : 'w-64'} transition-all duration-300`}>
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Avatar className="h-10 w-10 bg-foodie-green text-white">
              <AvatarFallback>{getInitials(restaurantName)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-semibold text-sm truncate max-w-[180px]">{restaurantName}</span>
              <span className="text-xs text-gray-500">Restaurant</span>
            </div>
          </div>
        )}
        {isCollapsed && (
          <Avatar className="h-10 w-10 mx-auto bg-foodie-green text-white">
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
        <ul className="space-y-2 px-2">
          {[
            { name: "Dashboard", icon: "home", path: "/restaurant-dashboard" },
            { name: "Menu", icon: "menu", path: "/restaurant-dashboard?tab=menu" },
            { name: "Orders", icon: "shopping-bag", path: "/restaurant-orders" },
            { name: "Analytics", icon: "bar-chart", path: "/restaurant-analytics" },
            { name: "Sustainability", icon: "leaf", path: "/restaurant-sustainability" },
            { name: "Settings", icon: "settings", path: "/restaurant-settings" },
          ].map((item) => (
            <li key={item.name}>
              <Link
                to={item.path}
                className="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <span className="material-icons text-foodie-green">{item.icon}</span>
                {!isCollapsed && <span className="ml-3">{item.name}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="outline"
          className={`w-full justify-center ${isCollapsed ? 'px-2' : ''}`}
          onClick={handleLogout}
        >
          <span className="material-icons mr-2">logout</span>
          {!isCollapsed && "Logout"}
        </Button>
      </div>
    </div>
  );
};

export default RestaurantSidebar;
