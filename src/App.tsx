
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import About from "./pages/About";
import Services from "./pages/Services";
import Restaurants from "./pages/Restaurants";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

// Additional route components
import NGORegister from "./pages/NGORegister";
import PackingRegister from "./pages/PackingRegister";
import RestaurantDashboard from "./pages/RestaurantDashboard";
import RestaurantWasteManagement from "./pages/RestaurantWasteManagement";
import RestaurantFoodPreparation from "./pages/RestaurantFoodPreparation";
import RestaurantPackaging from "./pages/RestaurantPackaging";
import UserDashboard from "./pages/UserDashboard";
import NGODashboard from "./pages/NGODashboard";
import PackingDashboard from "./pages/PackingDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ExploreRestaurants from "./pages/ExploreRestaurants";
import RestaurantDetail from "./pages/RestaurantDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/restaurants" element={<Restaurants />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/ngo-register" element={<NGORegister />} />
          <Route path="/packing-register" element={<PackingRegister />} />
          <Route path="/restaurant-dashboard" element={<RestaurantDashboard />} />
          <Route path="/restaurant-waste-management" element={<RestaurantWasteManagement />} />
          <Route path="/restaurant-food-preparation" element={<RestaurantFoodPreparation />} />
          <Route path="/restaurant-packaging" element={<RestaurantPackaging />} />
          <Route path="/user-dashboard" element={<UserDashboard />} />
          <Route path="/explore-restaurants" element={<ExploreRestaurants />} />
          <Route path="/restaurant/:id" element={<RestaurantDetail />} />
          <Route path="/ngo-dashboard" element={<NGODashboard />} />
          <Route path="/packing-dashboard" element={<PackingDashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
