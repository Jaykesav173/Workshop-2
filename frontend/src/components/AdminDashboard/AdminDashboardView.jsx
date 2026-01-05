import React, { useState, useEffect } from "react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    reportsGenerated: 0,
    reportsByStatus: {},
    reportsByType: {},
    reportsByDate: {},
  });

  const [recentReports, setRecentReports] = useState([]);

  const API_BASE = "http://localhost:8000/api";

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const resUsers = await fetch(`${API_BASE}/users`);
        const dataUsers = await resUsers.json();

        const resReports = await fetch(`${API_BASE}/reports/summary`);
        const dataReports = await resReports.json();

        const resRecentReports = await fetch(`${API_BASE}/activity/reports`);
        const dataRecentReports = await resRecentReports.json();

        if (dataUsers.success && dataReports.success) {
          const total = dataUsers.users.length;
          const active = dataUsers.users.filter((u) => u.Account_status === "ACTIVE").length;
          const inactive = dataUsers.users.filter((u) => u.Account_status === "INACTIVE").length;

          setStats({
            totalUsers: total,
            activeUsers: active,
            inactiveUsers: inactive,
            reportsGenerated: dataReports.totalReports,
            reportsByStatus: dataReports.byStatus,
            reportsByType: dataReports.byType,
            reportsByDate: dataReports.byDate,
          });

          if (dataRecentReports.success) {
            setRecentReports(dataRecentReports.activities);
          }
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-red-50 p-6 rounded-xl shadow-lg text-center">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-3xl font-bold text-black">{stats.totalUsers}</p>
        </div>
        <div className="bg-green-50 p-6 rounded-xl shadow-lg text-center">
          <p className="text-sm text-gray-500">Active Users</p>
          <p className="text-3xl font-bold text-green-600">{stats.activeUsers}</p>
        </div>
        <div className="bg-red-50 p-6 rounded-xl shadow-lg text-center">
          <p className="text-sm text-gray-500">Inactive Users</p>
          <p className="text-3xl font-bold text-red-600">{stats.inactiveUsers}</p>
        </div>
        <div className="bg-purple-50 p-6 rounded-xl shadow-lg text-center">
          <p className="text-sm text-gray-500">Reports Generated</p>
          <p className="text-3xl font-bold text-purple-600">{stats.reportsGenerated}</p>
        </div>
      </div>

      {/* Report Summary */}
      <div className="grid grid-cols-3 gap-6 mt-6">
        {/* Reports by Status */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">Reports by Status</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-600">
                <th className="text-left py-2">Status</th>
                <th className="text-right py-2">Count</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats.reportsByStatus).map(([status, count]) => (
                <tr key={status} className="border-t hover:bg-gray-50">
                  <td className="py-2">{status}</td>
                  <td className="py-2 text-right font-bold">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Reports by Type */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">Reports by Type</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-600">
                <th className="text-left py-2">Type</th>
                <th className="text-right py-2">Count</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats.reportsByType).map(([type, count]) => (
                <tr key={type} className="border-t hover:bg-gray-50">
                  <td className="py-2">{type}</td>
                  <td className="py-2 text-right font-bold">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Reports by Inspection Date */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">Reports by Inspection Date</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-600">
                <th className="text-left py-2">Date</th>
                <th className="text-right py-2">Count</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats.reportsByDate).map(([date, count]) => (
                <tr key={date} className="border-t hover:bg-gray-50">
                  <td className="py-2">{date}</td>
                  <td className="py-2 text-right font-bold">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
        <h3 className="text-lg font-semibold mb-4 border-b pb-2">Recent Reports</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-600">
              <th className="text-left py-2">Title</th>
              <th className="text-left py-2">Generated By</th>
              <th className="text-right py-2">Created At</th>
            </tr>
          </thead>
          <tbody>
            {recentReports.map((report, idx) => (
              <tr key={idx} className="border-t hover:bg-gray-50">
                <td className="py-2">{report.title}</td>
                <td className="py-2">{report.generated_by}</td>
                <td className="py-2 text-right">
                  {new Date(report.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
