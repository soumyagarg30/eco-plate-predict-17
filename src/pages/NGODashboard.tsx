
import React from "react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const NGODashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const userType = localStorage.getItem("foodieSync_userType");
    const userDataString = localStorage.getItem("foodieSync_userData");
    
    if (!userType || userType !== "ngo" || !userDataString) {
      navigate("/login");
      return;
    }
    
    try {
      const parsedData = JSON.parse(userDataString);
      setUserData(parsedData);
    } catch (error) {
      console.error("Error parsing user data:", error);
      navigate("/login");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">NGO Dashboard</h1>
        {userData && (
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Welcome, {userData.Name}</h2>
            <p className="mb-2"><strong>Email:</strong> {userData.Email}</p>
            {userData.Phone_Number && <p className="mb-2"><strong>Phone:</strong> {userData.Phone_Number}</p>}
            {userData.Address && <p className="mb-2"><strong>Address:</strong> {userData.Address}</p>}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default NGODashboard;
