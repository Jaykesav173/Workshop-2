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

  const [currentUserType, setCurrentUserType] = useState("");
  const [currentUsername, setCurrentUsername] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");

  const [showUserPassword, setShowUserPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showEngineerPassword, setShowEngineerPassword] = useState(false);

  // Main login handler
  const handleLogin = async ({ username, password, requested_role }) => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, requested_role }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.detail || "Login failed");
        return;
      }

      localStorage.setItem("loggedInUser", JSON.stringify(data.user));

      setCurrentUserType(requested_role);
      setCurrentUsername(username);
      setCurrentEmail(data.user.email);

      if (data.user.isFirstLogin) {
        // First login → show alert for password reset
        setShowPasswordChangeAlert(true);
      } else {
        // Normal login → redirect to dashboard
        const role = data.user.role.toUpperCase();
        if (role === "ADMIN") navigate("/admin_dashboard");
        else if (role === "ENGINEER") navigate("/engineer_dashboard");
        else navigate("/user_dashboard");
      }
    } catch (error) {
      console.error(error);
      alert("Server error. Please try again.");
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
                <Button className="w-full">Sign in as Inspector</Button>
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
                <Button className="w-full">Sign in as Admin</Button>
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
                <Button className="w-full">Sign in as Engineer</Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default Login;
