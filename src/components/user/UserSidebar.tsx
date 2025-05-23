
import { Home, LogOut, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { 
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";

interface UserSidebarProps {
  userName?: string;
}

const UserSidebar = ({ userName }: UserSidebarProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

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
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center p-2">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
            {userName ? userName.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="ml-3">
            <p className="font-medium">{userName || "User"}</p>
            <p className="text-xs text-muted-foreground">User Dashboard</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={window.location.pathname === "/user-dashboard"} 
                  onClick={() => navigate("/user-dashboard")}
                >
                  <Home className="h-4 w-4" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={window.location.pathname === "/explore-restaurants"} 
                  onClick={() => navigate("/explore-restaurants")}
                >
                  <Search className="h-4 w-4" />
                  <span>Explore Restaurants</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-2">
          <SidebarMenuButton 
            variant="outline"
            onClick={handleLogout}
            className="w-full justify-start"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default UserSidebar;
