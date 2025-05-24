
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Services from "./pages/Services";
import Restaurants from "./pages/Restaurants";
import RestaurantDetail from "./pages/RestaurantDetail";
import UserDashboard from "./pages/UserDashboard";
import RestaurantDashboard from "./pages/RestaurantDashboard";
import NGODashboard from "./pages/NGODashboard";
import PackingDashboard from "./pages/PackingDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NGORegister from "./pages/NGORegister";
import PackingRegister from "./pages/PackingRegister";
import RestaurantFoodPreparation from "./pages/RestaurantFoodPreparation";
import RestaurantPackaging from "./pages/RestaurantPackaging";
import RestaurantWasteManagement from "./pages/RestaurantWasteManagement";
import ExploreRestaurants from "./pages/ExploreRestaurants";
import PlaceOrder from "./pages/PlaceOrder";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/services" element={<Services />} />
          <Route path="/restaurants" element={<Restaurants />} />
          <Route path="/restaurant/:id" element={<RestaurantDetail />} />
          <Route path="/place-order/:restaurantId" element={<PlaceOrder />} />
          <Route path="/user-dashboard" element={<UserDashboard />} />
          <Route path="/restaurant-dashboard" element={<RestaurantDashboard />} />
          <Route path="/ngo-dashboard" element={<NGODashboard />} />
          <Route path="/packing-dashboard" element={<PackingDashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/ngo-register" element={<NGORegister />} />
          <Route path="/packing-register" element={<PackingRegister />} />
          <Route path="/restaurant-food-preparation" element={<RestaurantFoodPreparation />} />
          <Route path="/restaurant-packaging" element={<RestaurantPackaging />} />
          <Route path="/restaurant-waste-management" element={<RestaurantWasteManagement />} />
          <Route path="/explore-restaurants" element={<ExploreRestaurants />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </div>
    </Router>
  );
}

export default App;
