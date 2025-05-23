
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, LogIn } from "lucide-react";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-foodie-green-dark text-white py-4 px-6 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
            <span className="text-foodie-green-dark text-xl font-bold">F</span>
          </div>
          <span className="text-xl font-bold">FoodieSync</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="hover:text-foodie-yellow transition-colors">Home</Link>
          <Link to="/about" className="hover:text-foodie-yellow transition-colors">About Us</Link>
          <Link to="/services" className="hover:text-foodie-yellow transition-colors">Services</Link>
          <Link to="/restaurants" className="hover:text-foodie-yellow transition-colors">Restaurants</Link>
          <Link to="/contact" className="hover:text-foodie-yellow transition-colors">Contact Us</Link>
        </div>

        {/* Login/Register Buttons for Desktop */}
        <div className="hidden md:flex items-center gap-2">
          <Button asChild className="bg-foodie-yellow hover:bg-foodie-yellow-dark text-foodie-green-dark">
            <Link to="/login"><LogIn size={16} className="mr-1" /> Login</Link>
          </Button>
          <Button asChild className="bg-foodie-yellow hover:bg-foodie-yellow-dark text-foodie-green-dark">
            <Link to="/register">Register</Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button onClick={toggleMenu} className="md:hidden text-white">
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden pt-4 pb-4 px-6 bg-foodie-green-dark">
          <div className="flex flex-col gap-4">
            <Link to="/" className="hover:text-foodie-yellow transition-colors">Home</Link>
            <Link to="/about" className="hover:text-foodie-yellow transition-colors">About Us</Link>
            <Link to="/services" className="hover:text-foodie-yellow transition-colors">Services</Link>
            <Link to="/restaurants" className="hover:text-foodie-yellow transition-colors">Restaurants</Link>
            <Link to="/contact" className="hover:text-foodie-yellow transition-colors">Contact Us</Link>
            
            <div className="flex gap-2 pt-4">
              <Button asChild className="bg-foodie-yellow hover:bg-foodie-yellow-dark text-foodie-green-dark">
                <Link to="/login"><LogIn size={16} className="mr-1" /> Login</Link>
              </Button>
              <Button asChild className="bg-foodie-yellow hover:bg-foodie-yellow-dark text-foodie-green-dark">
                <Link to="/register">Register</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
