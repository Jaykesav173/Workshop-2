import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Lock, Check, X, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "../../components/ui/alert";
import axios from "axios";

const API_BASE = "http://localhost:8000";

const passwordRules = [
  { label: "At least 8 characters", test: (pwd) => pwd.length >= 8 },
  { label: "Contains uppercase letter", test: (pwd) => /[A-Z]/.test(pwd) },
  { label: "Contains lowercase letter", test: (pwd) => /[a-z]/.test(pwd) },
  { label: "Contains number", test: (pwd) => /\d/.test(pwd) },
  { label: "Contains special character", test: (pwd) => /[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]/.test(pwd) },
];

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPasswordValid = passwordRules.every((rule) => rule.test(newPassword));
  const passwordsMatch = newPassword === confirmPassword && confirmPassword !== "";

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Email is missing. Cannot reset password.");
      return;
    }

    if (!isPasswordValid) {
      setError("New password does not meet all requirements");
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await axios.post(`${API_BASE}/api/auth/reset_password_forgot`, {
        email,
        new_password: newPassword,
      });

      if (res.data.success) {
        setError("");
        alert("Password reset successfully! Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription className="text-sm text-slate-600">
            Account: <span className="font-medium">{email}</span>
          </CardDescription>
        </CardHeader>


        <CardContent>
          <form onSubmit={handleReset} className="space-y-4">
            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            {newPassword && (
              <div className="space-y-2 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-700">Password requirements:</p>
                <ul className="space-y-1">
                  {passwordRules.map((rule, index) => {
                    const isValid = rule.test(newPassword);
                    return (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        {isValid ? <Check className="size-4 text-green-600" /> : <X className="size-4 text-gray-400" />}
                        <span className={isValid ? "text-green-700" : "text-gray-600"}>{rule.label}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {confirmPassword && (
                <p className={`text-sm flex items-center gap-1 ${passwordsMatch ? "text-green-600" : "text-red-600"}`}>
                  {passwordsMatch ? <><Check className="size-4" /> Passwords match</> : <><X className="size-4" /> Passwords do not match</>}
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={!isPasswordValid || !passwordsMatch || isSubmitting}>
              {isSubmitting ? "Resetting Password..." : "Reset Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
