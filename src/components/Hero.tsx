
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <div className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="max-w-xl mb-10 md:mb-0">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foodie-green-dark">
              Personalizing Food <span className="text-foodie-yellow">Experiences</span>
            </h1>
            <p className="text-lg md:text-xl mb-8 text-gray-700">
              Helping restaurants predict demand, manage feedback, optimize facility 
              operations, and reduce waste for a sustainable future.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild className="bg-foodie-green hover:bg-foodie-green-dark text-white px-8 py-6 text-lg">
                <Link to="/register">Join as Restaurant</Link>
              </Button>
              <Button asChild className="bg-foodie-yellow hover:bg-foodie-yellow-dark text-foodie-green-dark px-8 py-6 text-lg">
                <Link to="/login">Login</Link>
              </Button>
            </div>
          </div>
          <div className="w-full md:w-1/2 lg:w-5/12">
            <img 
              src="/lovable-uploads/715acbd8-f10b-4c21-8814-7391636451e2.png" 
              alt="Chef preparing food" 
              className="w-full h-auto max-w-md mx-auto drop-shadow-xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
