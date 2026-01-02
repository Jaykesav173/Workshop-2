import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import {
  User,
  Shield,
  Wrench,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { authService } from "../../services/authService";
import { API_BASE } from "../../services/api";

function Login() {
  const navigate = useNavigate();

  const [credentials, setCredentials] = useState({
    userUsername: "",
    userPassword: "",
    adminUsername: "",
    adminPassword: "",
    engineerUsername: "",
    engineerPassword: "",
  });

  const [activeTab, setActiveTab] = useState("user");
  const [showPasswordChangeAlert, setShowPasswordChangeAlert] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [currentUserType, setCurrentUserType] = useState("");
  const [currentUsername, setCurrentUsername] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");

  const [showUserPassword, setShowUserPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showEngineerPassword, setShowEngineerPassword] = useState(false);

  // Main login handler - adapted to work with our auth system
  const handleLogin = async ({ username, password, requested_role }) => {
    setLoading(true);
    setError(null);

    try {
      // Try using our authService first
      const response = await authService.login(username, password);

      if (response.success || response.access_token) {
        // Store token and user info
        localStorage.setItem('token', response.access_token);
        if (response.user) {
          localStorage.setItem('user', JSON.stringify(response.user));
          localStorage.setItem('userRole', response.user.role || 'USER');
        }

        // Check for first login (if supported)
        if (response.user?.isFirstLogin) {
          setCurrentUserType(requested_role);
          setCurrentUsername(username);
          setCurrentEmail(response.user.email || '');
          setShowPasswordChangeAlert(true);
          setLoading(false);
          return;
        }

        // Redirect based on user role - use our dashboard routes
        const userRole = response.user?.role?.toUpperCase();
        if (userRole === 'ADMIN') {
          navigate('/admin/dashboard');
        } else if (userRole === 'INSPECTOR' || userRole === 'ENGINEER') {
          navigate('/inspector/dashboard');
        } else {
          navigate('/inspector/dashboard'); // Default to inspector dashboard
        }
      } else {
        setError(response.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login failed:', error);

      // If it's a credential issue (401) or inactive account (403), show error immediately. 
      // Do NOT run fallback, as that generates a confusing "Not Found" (404) if the fallback URL is wrong.
      if (error.response) {
        const status = error.response.status;
        const errorDetail = error.response.data?.detail || error.response.data?.message;

        if (status === 401) {
          setError(errorDetail || 'Invalid username or password.');
          setLoading(false);
          return;
        } else if (status === 403) {
          setError(errorDetail || 'Account is inactive. Please contact administrator.');
          setLoading(false);
          return;
        } else if (status === 500 && errorDetail && errorDetail.includes("hash")) {
          // Catch specific hash issues
          setError("System Error: Password data corrupted. Please contact admin to reset password.");
          setLoading(false);
          return;
        }
      }

      // Try alternative API endpoint only for network/server errors
      try {
        console.log("Attempting fallback login...");
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }), // Request role is not used by backend schema
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.detail || `Login failed (${res.status})`);
          setLoading(false);
          return;
        }

        // ... Success handling for fallback ...
        localStorage.setItem("loggedInUser", JSON.stringify(data.user));
        localStorage.setItem("token", data.access_token || data.token || "");

        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
          localStorage.setItem('userRole', data.user.role || 'USER');
        }

        setCurrentUserType(requested_role);
        setCurrentUsername(username);
        setCurrentEmail(data.user?.email || "");

        if (data.user?.isFirstLogin) {
          setShowPasswordChangeAlert(true);
          setLoading(false);
          return;
        }

        // Redirect
        const role = data.user?.role?.toUpperCase();
        if (role === "ADMIN") {
          navigate("/admin/dashboard");
        } else if (role === "INSPECTOR" || role === "ENGINEER") {
          navigate("/inspector/dashboard");
        } else {
          navigate("/inspector/dashboard");
        }
      } catch (fallbackError) {
        // Final catch-all
        if (error.response) {
          setError(error.response.data?.detail || `Login failed (${error.response.status})`);
        } else if (String(error).includes("Network Error")) {
          setError("Cannot connect to server. Is the backend running?");
        } else {
          setError(error.message || 'An unexpected error occurred.');
        }
      }
    } finally {
      if (!loading) setLoading(false); // Double check
    }

  };

  // Navigate to ChangePassword page on first login
  const handlePasswordChangeAcknowledged = () => {
    navigate("/change-password", {
      state: {
        userType: currentUserType,
        username: currentUsername,
        email: currentEmail,
      },
    });
  };

  // Forgot password link component
  const ForgotPasswordLink = () => (
    <div className="flex justify-end text-sm mt-1">
      <button
        type="button"
        className="text-blue-600 hover:underline"
        onClick={() => navigate("/recover/forgot")}
      >
        Forgot Password?
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      {/* First Login Alert */}
      <AlertDialog
        open={showPasswordChangeAlert}
        onOpenChange={setShowPasswordChangeAlert}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-full bg-orange-100 p-2">
                <AlertTriangle className="size-6 text-orange-600" />
              </div>
              <AlertDialogTitle>Password Change Required</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              This is your first login. You must change your password before
              continuing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handlePasswordChangeAcknowledged}>
              Continue to Change Password
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Login Card */}
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="user">
                <User className="size-4 mr-1" /> Inspector
              </TabsTrigger>
              <TabsTrigger value="admin">
                <Shield className="size-4 mr-1" /> Admin
              </TabsTrigger>
              <TabsTrigger value="engineer">
                <Wrench className="size-4 mr-1" /> Engineer
              </TabsTrigger>
            </TabsList>

            {/* Inspector Tab */}
            <TabsContent value="user">
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLogin({
                    username: credentials.userUsername,
                    password: credentials.userPassword,
                    requested_role: "inspector",
                  });
                }}
              >
                <Label>Username</Label>
                <Input
                  value={credentials.userUsername}
                  onChange={(e) =>
                    setCredentials((p) => ({
                      ...p,
                      userUsername: e.target.value,
                    }))
                  }
                  required
                  disabled={loading}
                />

                <Label>Password</Label>
                <div className="relative">
                  <Input
                    type={showUserPassword ? "text" : "password"}
                    value={credentials.userPassword}
                    onChange={(e) =>
                      setCredentials((p) => ({
                        ...p,
                        userPassword: e.target.value,
                      }))
                    }
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowUserPassword(!showUserPassword)}
                  >
                    {showUserPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <ForgotPasswordLink />
                <Button className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign in as Inspector'}
                </Button>
              </form>
            </TabsContent>

            {/* Admin Tab */}
            <TabsContent value="admin">
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLogin({
                    username: credentials.adminUsername,
                    password: credentials.adminPassword,
                    requested_role: "admin",
                  });
                }}
              >
                <Label>Username</Label>
                <Input
                  value={credentials.adminUsername}
                  onChange={(e) =>
                    setCredentials((p) => ({
                      ...p,
                      adminUsername: e.target.value,
                    }))
                  }
                  required
                  disabled={loading}
                />

                <Label>Password</Label>
                <div className="relative">
                  <Input
                    type={showAdminPassword ? "text" : "password"}
                    value={credentials.adminPassword}
                    onChange={(e) =>
                      setCredentials((p) => ({
                        ...p,
                        adminPassword: e.target.value,
                      }))
                    }
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                  >
                    {showAdminPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <ForgotPasswordLink />
                <Button className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign in as Admin'}
                </Button>
              </form>
            </TabsContent>

            {/* Engineer Tab */}
            <TabsContent value="engineer">
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLogin({
                    username: credentials.engineerUsername,
                    password: credentials.engineerPassword,
                    requested_role: "engineer",
                  });
                }}
              >
                <Label>Username</Label>
                <Input
                  value={credentials.engineerUsername}
                  onChange={(e) =>
                    setCredentials((p) => ({
                      ...p,
                      engineerUsername: e.target.value,
                    }))
                  }
                  required
                  disabled={loading}
                />

                <Label>Password</Label>
                <div className="relative">
                  <Input
                    type={showEngineerPassword ? "text" : "password"}
                    value={credentials.engineerPassword}
                    onChange={(e) =>
                      setCredentials((p) => ({
                        ...p,
                        engineerPassword: e.target.value,
                      }))
                    }
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() =>
                      setShowEngineerPassword(!showEngineerPassword)
                    }
                  >
                    {showEngineerPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <ForgotPasswordLink />
                <Button className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign in as Engineer'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default Login;
