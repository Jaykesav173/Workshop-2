import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HelpCircle, Mail } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";

const API_BASE = "http://localhost:8000";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_BASE}/api/auth/verify_security_questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          school_name: schoolName,
          mother_name: motherName,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage("✅ Security answers verified. OTP sent to your email.");
        navigate("/recover/otp", { state: { email } });
      } else {
        setMessage(data.detail || "Error verifying security answers.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <HelpCircle className="w-8 h-8 text-white" />
          </div>
          <CardTitle>Security Verification</CardTitle>
          <CardDescription>
            Please answer your security questions to verify your identity
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Account Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="school-name">What is the name of your primary school?</Label>
                <Input
                  id="school-name"
                  type="text"
                  placeholder="Enter your answer"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mother-name">What is your mother's maiden name?</Label>
                <Input
                  id="mother-name"
                  type="text"
                  placeholder="Enter your answer"
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                  required
                />
              </div>
            </div>

            <CardFooter className="flex flex-col gap-3">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? "Verifying..." : "Verify Answers & Send OTP"}
              </Button>

              {message && (
                <p className="text-center text-red-600 text-sm">{message}</p>
              )}

              <button
                type="button"
                onClick={() => navigate(-1)}
                className="text-sm text-blue-600 hover:underline"
              >
                ← Back
              </button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
