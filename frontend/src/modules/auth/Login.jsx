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
import IPetroLogo from "../../components/IPetroLogo";

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

  // Helper to enforce that the role used for login matches the selected tab
  const validateRoleForTab = (requested_role, backendRole) => {
    if (!backendRole) return "Role not found for this account.";

    const backend = backendRole.toUpperCase();
    const requested = (requested_role || "").toUpperCase();

    // Map tab roles to backend roles
    if (requested === "ADMIN" && backend !== "ADMIN") {
      return "This account is not an ADMIN. Please use the correct role tab.";
    }
    if (requested === "INSPECTOR" && backend !== "INSPECTOR") {
      return "This account is not an INSPECTOR. Please use the correct role tab.";
    }
    if (requested === "ENGINEER" && backend !== "ENGINEER") {
      return "This account is not an ENGINEER. Please use the correct role tab.";
    }

    return null; // OK
  };

  // Main login handler
  const handleLogin = async ({ username, password, requested_role }) => {
    setLoading(true);
    setError(null);

    try {
      // Try using our authService first
      const response = await authService.login(username, password);

      if (response.success || response.access_token) {
        const backendRole = response.user?.role;
        // Enforce role-based login per selected tab
        const roleError = validateRoleForTab(requested_role, backendRole);
        if (roleError) {
          setError(roleError);
          setLoading(false);
          return;
        }

        // Store token and user info (only after role validation)
        localStorage.setItem('token', response.access_token);
        if (response.user) {
          localStorage.setItem('user', JSON.stringify(response.user));
          localStorage.setItem('userRole', response.user.role || 'USER');

          if (response.notifications && response.notifications.length > 0) {
            localStorage.setItem('loginNotifications', JSON.stringify(response.notifications));
          }
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
        } else if (userRole === 'ENGINEER') {
          navigate('/engineer/dashboard');
        } else if (userRole === 'INSPECTOR') {
          navigate('/inspector/dashboard');
        } else {
          navigate('/inspector/dashboard'); // Default to inspector dashboard
        }
      } else {
        setError(response.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login failed:', error);

      // Try alternative API endpoint from dev-haifa if our authService fails
      try {
        const res = await fetch(`${API_BASE}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password, requested_role }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.detail || "Login failed");
          setLoading(false);
          return;
        }

        const backendRole = data.user?.role;
        const roleError = validateRoleForTab(requested_role, backendRole);
        if (roleError) {
          setError(roleError);
          setLoading(false);
          return;
        }

        localStorage.setItem("loggedInUser", JSON.stringify(data.user));
        localStorage.setItem("token", data.access_token || data.token || "");

        if (data.notifications && data.notifications.length > 0) {
          localStorage.setItem('loginNotifications', JSON.stringify(data.notifications));
        }

        setCurrentUserType(requested_role);
        setCurrentUsername(username);
        setCurrentEmail(data.user.email);

        if (data.user.isFirstLogin) {
          setShowPasswordChangeAlert(true);
          setLoading(false);
          return;
        }

        // Redirect to our dashboard routes
        const role = data.user.role?.toUpperCase();
        if (role === "ADMIN") {
          navigate("/admin/dashboard");
        } else {
          navigate("/inspector/dashboard");
        }
      } catch (fallbackError) {
        // Handle error from our authService
        if (error.response) {
          const errorDetail = error.response.data?.detail || error.response.data?.message;
          if (error.response.status === 401) {
            setError(errorDetail || 'Invalid username or password. Please check your credentials.');
          } else if (error.response.status === 403) {
            setError(errorDetail || 'Account is inactive. Please contact administrator.');
          } else {
            setError(errorDetail || `Login failed (${error.response.status}). Please try again.`);
          }
        } else if (error.request) {
          if (error.code === 'ECONNABORTED') {
            setError('Request timeout - server is not responding. Please check if backend is running.');
          } else {
            setError('Cannot connect to server. Please check if the backend is running.');
          }
        } else {
          setError(error.message || 'An error occurred. Please try again.');
        }
      }
    } finally {
      setLoading(false);
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
    <div className="flex justify-end text-sm">
      <button
        type="button"
        className="text-red-600 hover:text-red-700 hover:underline font-medium transition-colors"
        onClick={() => navigate("/recover/forgot")}
      >
        Forgot Password?
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/40 to-slate-100 flex flex-col items-center justify-center p-4">
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

      {/* Logo and Company Branding */}
      <div className="mb-8 flex flex-col items-center">
        <IPetroLogo size={140} className="mb-4" />
        <p className="text-red-600 text-sm font-medium tracking-wide drop-shadow-sm">
          VISOR Inspection Management System
        </p>
      </div>

      {/* Login Card */}
      {/* Login Card */}
      <Card className="w-full max-w-md shadow-2xl border-0 bg-slate-900 rounded-2xl">
        <CardHeader className="text-center pb-6 pt-8 relative z-10">
          <CardTitle className="text-2xl font-semibold text-white drop-shadow-lg">
            Welcome back
          </CardTitle>
          <CardDescription className="text-slate-400 mt-2">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 pb-8">
          {/* Error Display */}
          {error && (
            <div className="mb-5 p-3 bg-red-500/10 border border-red-500/50 text-red-200 rounded-lg text-sm shadow-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 w-full bg-slate-100 p-1 rounded-xl">
              <TabsTrigger
                value="user"
                className="data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:font-semibold data-[state=active]:shadow-sm text-slate-500 hover:text-slate-800"
              >
                <User className="size-4 mr-1.5" /> Inspector
              </TabsTrigger>
              <TabsTrigger
                value="admin"
                className="data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:font-semibold data-[state=active]:shadow-sm text-slate-500 hover:text-slate-800"
              >
                <Shield className="size-4 mr-1.5" /> Admin
              </TabsTrigger>
              <TabsTrigger
                value="engineer"
                className="data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:font-semibold data-[state=active]:shadow-sm text-slate-500 hover:text-slate-800"
              >
                <Wrench className="size-4 mr-1.5" /> Engineer
              </TabsTrigger>
            </TabsList>

            {/* Inspector Tab */}
            <TabsContent value="user" className="mt-6">
              <form
                className="space-y-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLogin({
                    username: credentials.userUsername,
                    password: credentials.userPassword,
                    requested_role: "inspector",
                  });
                }}
              >
                <div className="space-y-2">
                  <Label className="text-slate-400 font-medium">Username</Label>
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
                    className="h-11 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-red-600 focus:ring-red-600 rounded-xl"
                    placeholder="Enter your username"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-400 font-medium">Password</Label>
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
                      className="h-11 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-red-600 focus:ring-red-600 rounded-xl pr-10"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                      onClick={() => setShowUserPassword(!showUserPassword)}
                    >
                      {showUserPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <ForgotPasswordLink />
                <Button
                  className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm transition-all rounded-xl"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign in as Inspector'}
                </Button>
              </form>
            </TabsContent>

            {/* Admin Tab */}
            <TabsContent value="admin" className="mt-6">
              <form
                className="space-y-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLogin({
                    username: credentials.adminUsername,
                    password: credentials.adminPassword,
                    requested_role: "admin",
                  });
                }}
              >
                <div className="space-y-2">
                  <Label className="text-slate-400 font-medium">Username</Label>
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
                    className="h-11 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-red-600 focus:ring-red-600 rounded-xl"
                    placeholder="Enter your username"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-400 font-medium">Password</Label>
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
                      className="h-11 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-red-600 focus:ring-red-600 rounded-xl pr-10"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                    >
                      {showAdminPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <ForgotPasswordLink />
                <Button
                  className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm transition-all rounded-xl"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign in as Admin'}
                </Button>
              </form>
            </TabsContent>

            {/* Engineer Tab */}
            <TabsContent value="engineer" className="mt-6">
              <form
                className="space-y-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLogin({
                    username: credentials.engineerUsername,
                    password: credentials.engineerPassword,
                    requested_role: "engineer",
                  });
                }}
              >
                <div className="space-y-2">
                  <Label className="text-slate-400 font-medium">Username</Label>
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
                    className="h-11 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-red-600 focus:ring-red-600 rounded-xl"
                    placeholder="Enter your username"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-400 font-medium">Password</Label>
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
                      className="h-11 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-red-600 focus:ring-red-600 rounded-xl pr-10"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                      onClick={() =>
                        setShowEngineerPassword(!showEngineerPassword)
                      }
                    >
                      {showEngineerPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <ForgotPasswordLink />
                <Button
                  className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm transition-all rounded-xl"
                  disabled={loading}
                >
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