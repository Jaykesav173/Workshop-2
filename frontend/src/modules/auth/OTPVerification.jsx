import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Smartphone } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";

const API_BASE = "http://localhost:8000";

export default function VerifyOTP() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";

  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) return alert("Enter a 6-digit OTP");
    if (!email) return alert("Email is missing");

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify_otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage("✅ OTP verified! Redirecting...");
        navigate("/recover/reset", { state: { email } });
      } else {
        setMessage(data.detail || "Invalid OTP");
      }
    } catch (err) {
      console.error(err);
      setMessage("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          <CardTitle>Enter OTP</CardTitle>
          <CardDescription>
            We've sent a 6-digit code to your registered email/phone
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div className="text-center text-sm text-blue-700 bg-blue-100 p-2 rounded">
              Code sent to: <span className="font-medium">{email}</span>
            </div>

            <Input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              required
              className="text-center tracking-widest font-mono text-lg"
            />

            <CardFooter className="flex flex-col gap-3">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </Button>

              {message && (
                <p className="text-center text-red-600 text-sm">{message}</p>
              )}

              <button
                type="button"
                onClick={() => navigate(-1)}
                className="text-sm text-purple-600 hover:underline"
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
