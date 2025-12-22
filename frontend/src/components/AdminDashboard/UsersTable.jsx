import { useEffect, useState } from "react";

export function UsersTable() {
  const API_BASE = "http://localhost:8000/api";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    role: "",
  });

  /* ================= FETCH USERS ================= */
  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/users`);
      const data = await res.json();

      if (data.success) {
        setUsers(
          data.users.map((u) => ({
            ...u,
            status: u.Account_status ?? "UNKNOWN",
          }))
        );
      } else {
        setError("Failed to load users");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  /* ================= ADD USER ================= */
  const handleAddUser = async (e) => {
    e.preventDefault();

    if (!newUser.name || !newUser.email || !newUser.username || !newUser.role) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newUser,
          password: newUser.password || "",
          Account_status: "ACTIVE",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.detail || "Failed to add user");
        return;
      }

      alert("✅ User added successfully!");

      setNewUser({
        name: "",
        email: "",
        username: "",
        password: "",
        role: "",
      });

      setShowModal(false);
      fetchUsers();
    } catch (err) {
      alert("Server error");
    }
  };

  /* ================= TOGGLE STATUS ================= */
  const toggleStatus = async (id) => {
    const res = await fetch(`${API_BASE}/users/${id}/status`, {
      method: "PATCH",
    });
    const data = await res.json();

    if (data.success) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === id ? { ...u, status: data.new_status } : u
        )
      );
    }
  };

  /* ================= FILTERING ================= */
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase());

    const matchStatus =
      statusFilter === "ALL" || u.status === statusFilter;

    const matchRole =
      roleFilter === "ALL" || u.role === roleFilter;

    return matchSearch && matchStatus && matchRole;
  });

  /* ================= STATS ================= */
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === "ACTIVE").length;
  const inactiveUsers = users.filter((u) => u.status !== "ACTIVE").length;

  if (loading) return <p>Loading users...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="bg-white p-6 rounded-xl shadow">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">User Management</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
        >
          + Add User
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-2xl font-bold">{totalUsers}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">{activeUsers}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-500">Inactive</p>
          <p className="text-2xl font-bold text-red-600">{inactiveUsers}</p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Search users..."
          className="border px-4 py-2 rounded-lg flex-1"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="border px-3 py-2 rounded-lg"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>

        <select
          className="border px-3 py-2 rounded-lg"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="ALL">All Roles</option>
          <option value="ADMIN">ADMIN</option>
          <option value="INSPECTOR">INSPECTOR</option>
          <option value="ENGINEER">ENGINEER</option>
        </select>
      </div>

      {/* TABLE */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2 text-left">ID</th>
            <th className="px-4 py-2 text-left">Name</th>
            <th className="px-4 py-2 text-left">Email</th>
            <th className="px-4 py-2 text-left">Username</th>
            <th className="px-4 py-2 text-left">Role</th>
            <th className="px-4 py-2 text-left">Status</th>
            <th className="px-4 py-2 text-center">Action</th>
          </tr>
        </thead>

        <tbody>
          {filteredUsers.map((u) => (
            <tr key={u.id} className="border-t">
              <td className="px-4 py-2">{u.id}</td>
              <td className="px-4 py-2">{u.name}</td>
              <td className="px-4 py-2">{u.email}</td>
              <td className="px-4 py-2">{u.username}</td>
              <td className="px-4 py-2">{u.role}</td>
              <td
                className={`px-4 py-2 font-semibold ${
                  u.status === "ACTIVE"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {u.status}
              </td>
              <td className="text-center">
                <button
                  onClick={() => toggleStatus(u.id)}
                  className={`px-3 py-1 rounded text-white ${
                    u.status === "ACTIVE"
                      ? "bg-red-500"
                      : "bg-green-500"
                  }`}
                >
                  {u.status === "ACTIVE" ? "Deactivate" : "Activate"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ADD USER MODAL (matches screenshot) */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black"
            >
              ✕
            </button>

            <h2 className="text-xl font-semibold mb-1">Add New User</h2>
            <p className="text-sm text-gray-500 mb-6">
              Create a new user account. Fill in the details below.
            </p>

            <form onSubmit={handleAddUser} className="space-y-4">
              {["name", "email", "username"].map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium mb-1 capitalize">
                    {field.replace("_", " ")}
                  </label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={newUser[field]}
                    onChange={(e) =>
                      setNewUser({ ...newUser, [field]: e.target.value })
                    }
                  />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium mb-1">
                  Password (Optional)
                </label>
                <input
                  type="password"
                  className="w-full border rounded-lg px-3 py-2"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Role
                </label>
                <select
                  className="w-full border rounded-lg px-3 py-2"
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({ ...newUser, role: e.target.value })
                  }
                >
                  <option value="">Select Role</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="INSPECTOR">INSPECTOR</option>
                  <option value="ENGINEER">ENGINEER</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded-lg"
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
