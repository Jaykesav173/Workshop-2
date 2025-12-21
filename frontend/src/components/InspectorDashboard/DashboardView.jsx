// frontend/src/components/DashboardView.jsx
import { useEffect, useState } from "react";
import { ClipboardCheck, Camera, FileText } from "lucide-react";

export default function DashboardView() {
  const [userId, setUserId] = useState(null);
  const [stats, setStats] = useState({
    totalInspections: 0,
    photosUploaded: 0,
    reportsGenerated: 0,
  });
  const [statusData, setStatusData] = useState({});
  const [trendData, setTrendData] = useState({});
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = "http://localhost:8000";

  // ✅ Get user ID from local storage
  useEffect(() => {
    const storedUser = localStorage.getItem("loggedInUser");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user?.id) {
        setUserId(user.id);
      }
    }
  }, []);

  // ✅ Fetch dashboard data
  useEffect(() => {
    if (!userId) return;

    const fetchSummary = async () => {
      try {
        setLoading(true);

        // Summary
        const resSummary = await fetch(`${API_BASE}/dashboard/user_summary/${userId}`);
        const summary = await resSummary.json();

        // Status breakdown
        const resStatus = await fetch(`${API_BASE}/dashboard/reports_by_status/${userId}`);
        const status = await resStatus.json();

        // Trend
        const resTrend = await fetch(`${API_BASE}/dashboard/reports_trend/${userId}`);
        const trend = await resTrend.json();

        // Recent activity
        const resActivity = await fetch(`${API_BASE}/dashboard/recent_activity/${userId}`);
        const activity = await resActivity.json();

        console.log("Dashboard summary:", summary);
        console.log("Status breakdown:", status);
        console.log("Trend data:", trend);
        console.log("Recent activity:", activity);

        if (summary.success) {
          setStats({
            totalInspections: summary.totalInspections,
            photosUploaded: summary.photosUploaded,
            reportsGenerated: summary.reportsGenerated,
          });
        }
        if (status.success) setStatusData(status.byStatus);
        if (trend.success) setTrendData(trend.trend);
        if (activity.success) setActivities(activity.activities);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [userId]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Dashboard</h1>
        <p className="text-sm text-gray-500">Inspector ID: {userId}</p>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading dashboard data...</p>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card
              icon={<ClipboardCheck />}
              label="Total Inspections"
              value={stats.totalInspections}
              color="blue"
            />
            <Card
              icon={<Camera />}
              label="Photos Uploaded"
              value={stats.photosUploaded}
              color="green"
            />
            <Card
              icon={<FileText />}
              label="Reports Generated"
              value={stats.reportsGenerated}
              color="purple"
            />
          </div>

          {/* Reports by Status */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Reports by Status</h2>
            <ul className="space-y-2">
              {Object.entries(statusData).map(([status, count]) => (
                <li key={status} className="flex justify-between">
                  <span className="text-gray-600">{status}</span>
                  <span className="font-bold">{count}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Reports Trend */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Reports Trend</h2>
            <ul className="space-y-2">
              {Object.entries(trendData).map(([date, count]) => (
                <li key={date} className="flex justify-between">
                  <span className="text-gray-600">{date}</span>
                  <span className="font-bold">{count}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
            <ul className="space-y-2">
              {activities.map((a, idx) => (
                <li key={idx} className="flex justify-between">
                  <span className="text-gray-600">{a.title} — {a.status}</span>
                  <span className="text-sm text-gray-500">{a.created_at}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

function Card({ icon, label, value, color }) {
  const bgColor = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
  }[color];

  return (
    <div
      className={`rounded-xl shadow-md p-6 flex items-center gap-4 ${bgColor}`}
    >
      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}
