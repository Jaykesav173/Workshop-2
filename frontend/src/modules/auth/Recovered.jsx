// Recovered.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function Recovered() {
  const navigate = useNavigate();

  const handleLoginRedirect = () => {
    navigate("/login"); // replace with your actual login route
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="bg-white p-6 rounded shadow w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4">Password Reset Successful</h2>
        <p className="mb-6">Your password has been updated successfully. You can now log in with your new password.</p>
        <button
          className="bg-blue-700 text-white py-2 px-4 rounded hover:bg-blue-800"
          onClick={handleLoginRedirect}
        >
          Go to Login
        </button>
      </div>
    </div>
  );
}
