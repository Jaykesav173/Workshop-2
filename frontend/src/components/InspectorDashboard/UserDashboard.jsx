import { useEffect, useState } from "react";
import axios from "axios";

import {
  LayoutDashboard,
  FileText,
  Camera,
  Cpu,
  AlertTriangle,
  Wrench,
  Bell,
  Settings
} from "lucide-react";

import { SettingsView } from "./SettingsView.jsx";
import DashboardView from "./DashboardView.jsx";

const API_BASE = "http://localhost:8000/api";

export default function UserDashboard() {

  // ---------------- STATES ----------------
  const [user, setUser] = useState({
    id: null,
    name: "",
    username: "",
    email: "",
    role: ""
  });

  const [activeSection, setActiveSection] = useState("dashboard");


  // ---------------- LOAD USER ----------------
  useEffect(() => {
    const storedUser = localStorage.getItem("loggedInUser");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);


  // ---------------- LIVE USER UPDATE ----------------
  useEffect(() => {
    const updateUserFromStorage = () => {
      const data = localStorage.getItem("loggedInUser");
      if (data) setUser(JSON.parse(data));
    };

    window.addEventListener("storage", updateUserFromStorage);
    updateUserFromStorage();

    return () =>
      window.removeEventListener("storage", updateUserFromStorage);
  }, []);


  const avatarLetter = (user?.name || user?.username || "U")
    .charAt(0)
    .toUpperCase();


  // ---------------- LOGOUT ----------------
  const handleLogout = () => {
    localStorage.clear();
    window.location.replace("/login");
  };


  // ---------------- SECTION LABELS ----------------
  const sectionTitles = {
    workflow: "Inspection Workflow",
    upload: "Upload Photos",
    reports: "Generate Reports",
    ai: "AI Analysis",
    violation: "Violation Records",
    equipment: "Equipment Management"
  };


  // ================== UI ==================
  return (
    <div className="flex min-h-screen bg-gray-100">


      {/* ================= SIDEBAR ================= */}
      <aside className="w-64 bg-white shadow-md p-4 space-y-5">

        <h2 className="text-xl font-bold mb-4">VISOR</h2>

        <nav className="space-y-2 text-sm">

          <NavItem icon={LayoutDashboard}
            label="Dashboard"
            active={activeSection === "dashboard"}
            onClick={() => setActiveSection("dashboard")}
          />

          <NavItem icon={FileText}
            label="Inspection Workflow"
            active={activeSection === "workflow"}
            onClick={() => setActiveSection("workflow")}
          />

          <NavItem icon={Camera}
            label="Photo Upload"
            active={activeSection === "upload"}
            onClick={() => setActiveSection("upload")}
          />

          <NavItem icon={FileText}
            label="Generate Report"
            active={activeSection === "reports"}
            onClick={() => setActiveSection("reports")}
          />

          <NavItem icon={Cpu}
            label="Device AI"
            active={activeSection === "ai"}
            onClick={() => setActiveSection("ai")}
          />

          <NavItem icon={AlertTriangle}
            label="Violation"
            active={activeSection === "violation"}
            onClick={() => setActiveSection("violation")}
          />

          <NavItem icon={Wrench}
            label="Equipment"
            active={activeSection === "equipment"}
            onClick={() => setActiveSection("equipment")}
          />

          <NavItem icon={Settings}
            label="Settings"
            active={activeSection === "profile"}
            onClick={() => setActiveSection("profile")}
          />

        </nav>

      </aside>


      {/* ================= MAIN ================= */}
      <main className="flex-1 p-6 space-y-6">

        {/* ---------- HEADER ---------- */}
        <div className="flex justify-between items-center">

          <h1 className="text-2xl font-bold">
            Welcome back, {user.username}
          </h1>

          <div className="flex items-center gap-4">

            <div className="relative cursor-pointer">
              <Bell size={22} />
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full px-[6px]">3</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-red-600 text-white w-10 h-10 rounded-full grid place-items-center">
                {avatarLetter}
              </div>

              <div>
                <p className="text-sm font-medium">
                  {user.name || user.username}
                </p>

                <p className="text-xs text-gray-500">
                  {user.email}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:underline ml-4"
            >
              Logout
            </button>

          </div>
        </div>



        {/* ================= DASHBOARD ================= */}
        {activeSection === "dashboard" && (
          <DashboardView />
        )}



        {/* ================= SETTINGS ================= */}
        {activeSection === "profile" && (
          <SettingsView />
        )}



        {/* ================= PLACEHOLDERS ================= */}
        {activeSection !== "dashboard" && activeSection !== "profile" && (
          <div className="bg-white p-6 rounded-xl shadow-sm">

            <h2 className="text-lg font-semibold">
              {sectionTitles[activeSection]}
            </h2>

            <p className="text-gray-500 mt-3">
              This module is under development.
            </p>

          </div>
        )}

      </main>

    </div>
  );
}



// ================= NAV ITEM =================
function NavItem({ icon: Icon, label, active, onClick }) {

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2 p-2 rounded cursor-pointer
        ${active ? "bg-red-100 text-red-700" : "hover:bg-gray-100"}`}
    >
      <Icon className="size-4" />
      <span>{label}</span>
    </div>
  );

}
