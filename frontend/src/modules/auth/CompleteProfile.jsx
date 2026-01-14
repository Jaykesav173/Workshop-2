import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { User, CreditCard, HelpCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";

export default function CompleteProfile() {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state || !state.username || !state.role) {
    return (
      <div className="h-screen flex items-center justify-center">
        <h2 className="text-red-600 text-lg">Session expired. Please login again.</h2>
      </div>
    );
  }

  const { username, role } = state; // username and role from state

  const [icNumber, setIcNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleIcChange = (value) => {
    const cleaned = value.replace(/\D/g, "");
    let formatted = cleaned;
    if (cleaned.length > 6) formatted = `${cleaned.slice(0, 6)}-${cleaned.slice(6)}`;
    if (cleaned.length > 8) formatted = `${cleaned.slice(0, 6)}-${cleaned.slice(6, 8)}-${cleaned.slice(8, 12)}`;
    setIcNumber(formatted);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/users/complete_profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          role, // use role directly
          ic_number: icNumber.replace(/-/g, ""),
          date_of_birth: dateOfBirth,
          phone_number: phoneNumber,
          school_name: schoolName,
          mother_name: motherName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.detail || "Failed to complete profile.");
        return;
      }

      alert("✅ Profile completed successfully!");

      // Navigate to respective dashboard based on role
      if (role.toUpperCase() === "ENGINEER") {
        navigate("/engineer_dashboard");
      } else if (role.toUpperCase() === "ADMIN") {
        navigate("/admin_dashboard");
      } else {
        navigate("/user_dashboard");
      }
    } catch (err) {
      console.error("❌ Server error:", err);
      alert("Server error. Try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <CardTitle>Complete Your Profile</CardTitle>
          <CardDescription>Fill in details to secure your account</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h4 className="flex items-center gap-2"><CreditCard className="w-5 h-5" />Personal Information</h4>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <Label>IC Number</Label>
                  <Input
                    value={icNumber}
                    onChange={(e) => handleIcChange(e.target.value)}
                    placeholder="123456-78-9012"
                    maxLength={14}
                    required
                  />
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
              </div>

              <div className="mt-4">
                <Label>Phone Number</Label>
                <Input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <h4 className="flex items-center gap-2"><HelpCircle className="w-5 h-5" />Security Questions</h4>
              <Label className="mt-2">Primary School</Label>
              <Input
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                required
              />
              <Label className="mt-4">Mother Maiden Name</Label>
              <Input
                value={motherName}
                onChange={(e) => setMotherName(e.target.value)}
                required
              />
            </div>

            <CardFooter>
              <Button type="submit" className="w-full bg-green-600" disabled={loading}>
                {loading ? "Saving..." : "Complete Profile"}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
