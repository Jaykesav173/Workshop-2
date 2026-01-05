import { useEffect, useState } from "react";
import axios from "axios";

import {
  LayoutDashboard,
  Users,
  Settings,
  Bell,
} from "lucide-react";

import { UsersTable } from "./UsersTable.jsx";
import { SettingsView } from "./SettingsView.jsx";
import AdminDashboardView from "./AdminDashboardView.jsx";

const API_BASE = "http://localhost:8000/api";

export default function AdminDashboard() {

  // =============== STATES ===============
  const [admin, setAdmin] = useState({
    id: null,
    name: "",
    username: "",
    email: "",
    role: "admin",
  });

  const [activeSection, setActiveSection] = useState("dashboard");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);


  // =============== LOAD USER + USERS DATA ===============
  useEffect(() => {
    const loadDashboard = async () => {
      try {

        // Get admin info from login
        const storedUser = localStorage.getItem("loggedInUser");
        if (storedUser) {
          setAdmin(JSON.parse(storedUser));
        }

        // Load users list (REAL API)
        const usersRes = await axios.get(
          `${API_BASE}/admin/users/recent`
        );

        setUsers(usersRes.data || []);

      } catch (err) {
        console.error("Admin dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);


  // =============== LOGOUT ===============
  const handleLogout = () => {
    localStorage.clear();
    window.location.replace("/login");
  };


  const avatarLetter =
    (admin?.name || admin?.username || "A")
      .charAt(0)
      .toUpperCase();


  // ================= UI =================
  return (
    <div className="flex min-h-screen bg-gray-100">


      {/* ================= SIDEBAR ================= */}
      <aside className="w-64 bg-white shadow-md p-4">
        <h2 className="text-xl font-bold mb-6">
          VISOR Admin
        </h2>

        <nav className="space-y-1 text-sm">

          <NavItem
            icon={LayoutDashboard}
            label="Dashboard"
            active={activeSection === "dashboard"}
            onClick={() => setActiveSection("dashboard")}
          />

          <NavItem
            icon={Users}
            label="User Management"
            active={activeSection === "users"}
            onClick={() => setActiveSection("users")}
          />

          <NavItem
            icon={Settings}
            label="Profile Settings"
            active={activeSection === "profile"}
            onClick={() => setActiveSection("profile")}
          />

        </nav>
      </aside>



      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 p-6 space-y-6">


        {/* ================= HEADER ================= */}
        <header className="flex justify-between items-center">

          <h1 className="text-2xl font-bold">
            Welcome back, {admin.username}
          </h1>

          <div className="flex items-center gap-4">

            {/* Notification */}
            <div className="relative cursor-pointer">
              <Bell size={22} />
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs px-[6px] rounded-full">
                5
              </span>
            </div>

            {/* Profile */}
            <div className="flex items-center gap-3">
              <div className="bg-red-500 text-white w-10 h-10 rounded-full grid place-items-center font-semibold">
                {avatarLetter}
              </div>

              <div>
                <p className="text-sm font-medium">
                  {admin.name || admin.username}
                </p>
                <p className="text-xs text-gray-500">
                  {admin.email}
                </p>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="ml-4 text-sm text-red-600 hover:underline"
            >
              Logout
            </button>

          </div>
        </header>



        {/* ================= CONTENT ================= */}

        {loading && (
          <p className="text-center">
            Loading dashboard...
          </p>
        )}


        {/* ==== DASHBOARD ==== */}
        {!loading && activeSection === "dashboard" && (
          <AdminDashboardView />
        )}


        {/* ==== USERS ==== */}
        {!loading && activeSection === "users" && (
          <UsersTable users={users} />
        )}


        {/* ==== PROFILE SETTINGS ==== */}
        {!loading && activeSection === "profile" && (
          <SettingsView admin={admin} />
        )}

      </main>
    </div>
  );
}


// ================= SIDEBAR ITEM =================
function NavItem({ icon: Icon, label, onClick, active }) {

  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-2 p-2 rounded-lg cursor-pointer
        transition
        ${active
          ? "bg-red-100 text-red-700"
          : "hover:bg-gray-100 text-gray-700"}
      `}
    >
      <Icon size={16} />
      <span>{label}</span>
    </div>
  );
}
