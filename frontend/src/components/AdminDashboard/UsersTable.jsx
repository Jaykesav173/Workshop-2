import { useEffect, useState } from "react";
import { API_BASE } from "../../services/api.js";
import { Plus, X } from "lucide-react";

export function UsersTable() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

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

  const [editUser, setEditUser] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    role: "",
    Account_status: "",
  });

  /* ================= FETCH USERS ================= */
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch(`${API_BASE}/users`, {
        headers,
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          setError("Authentication required. Please login again.");
          return;
        }
        const errorData = await res.json().catch(() => ({ detail: 'Failed to load users' }));
        setError(errorData.detail || `Failed to load users (${res.status})`);
        return;
      }
      
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
      setError(err.message || "Network error. Please check your connection.");
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
      const token = localStorage.getItem('token');
      const headers = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch(`${API_BASE}/users`, {
        method: "POST",
        headers,
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
  const toggleStatus = async (id, e) => {
    e.stopPropagation(); // Prevent row click when toggling
    const token = localStorage.getItem('token');
    const headers = {
      "Content-Type": "application/json",
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const res = await fetch(`${API_BASE}/users/${id}/status`, {
      method: "PATCH",
      headers,
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

  /* ================= EDIT USER ================= */
  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditUser({
      name: user.name || "",
      email: user.email || "",
      username: user.username || "",
      password: "", // Don't pre-fill password
      role: user.role || "",
      Account_status: user.status || user.Account_status || "ACTIVE",
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();

    if (!editUser.name || !editUser.username || !editUser.role) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Only include password if it's provided
      const updateData = {
        name: editUser.name,
        email: editUser.email || null,
        username: editUser.username,
        role: editUser.role,
        Account_status: editUser.Account_status,
      };

      if (editUser.password) {
        updateData.password = editUser.password;
      }
      
      const res = await fetch(`${API_BASE}/users/${editingUser.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(updateData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.detail || "Failed to update user");
        return;
      }

      alert("✅ User updated successfully!");

      setEditUser({
        name: "",
        email: "",
        username: "",
        password: "",
        role: "",
        Account_status: "",
      });
      setEditingUser(null);
      setShowEditModal(false);
      fetchUsers();
    } catch (err) {
      alert("Server error");
    }
  };

  /* ================= FILTERING ================= */
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-gray-500">Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-6">
        <p className="font-semibold">Error</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
          <p className="text-gray-600">Manage user accounts, roles, and statuses.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-600 mb-1">Total Users</p>
          <p className="text-3xl font-bold text-gray-900">{totalUsers}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-600 mb-1">Active Users</p>
          <p className="text-3xl font-bold text-green-600">{activeUsers}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-600 mb-1">Inactive Users</p>
          <p className="text-3xl font-bold text-red-600">{inactiveUsers}</p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        <h2 className="text-xl font-semibold mb-4">Filter Users</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Search by name, email, or username..."
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="INSPECTOR">INSPECTOR</option>
            <option value="ENGINEER">ENGINEER</option>
            <option value="USER">USER</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <tr 
                    key={u.id} 
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleEditUser(u)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{u.email || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{u.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                        {u.role || 'USER'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          u.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {u.status}
                        </span>
                        {/* Toggle Switch */}
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={u.status === "ACTIVE"}
                            onChange={(e) => toggleStatus(u.id, e)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-red-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                        </label>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500 text-sm">
                    No users found. Try adjusting your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD USER MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Add New User</h2>
            <p className="text-sm text-gray-600 mb-6">
              Create a new user account. Fill in the details below.
            </p>

            <form onSubmit={handleAddUser} className="space-y-4">
              {["name", "email", "username"].map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                    {field.replace("_", " ")}
                  </label>
                  <input
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    value={newUser[field]}
                    onChange={(e) =>
                      setNewUser({ ...newUser, [field]: e.target.value })
                    }
                    required={field !== "email"}
                  />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password (Optional)
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({ ...newUser, role: e.target.value })
                  }
                  required
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
                  className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium shadow-sm"
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-6 relative">
            <button
              onClick={() => {
                setShowEditModal(false);
                setEditingUser(null);
                setEditUser({
                  name: "",
                  email: "",
                  username: "",
                  password: "",
                  role: "",
                  Account_status: "",
                });
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Edit User</h2>
            <p className="text-sm text-gray-600 mb-6">
              Update user information. Leave password blank to keep current password.
            </p>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  value={editUser.name}
                  onChange={(e) =>
                    setEditUser({ ...editUser, name: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  value={editUser.email}
                  onChange={(e) =>
                    setEditUser({ ...editUser, email: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  value={editUser.username}
                  onChange={(e) =>
                    setEditUser({ ...editUser, username: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password (Leave blank to keep current)
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  value={editUser.password}
                  onChange={(e) =>
                    setEditUser({ ...editUser, password: e.target.value })
                  }
                  placeholder="Enter new password or leave blank"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  value={editUser.role}
                  onChange={(e) =>
                    setEditUser({ ...editUser, role: e.target.value })
                  }
                  required
                >
                  <option value="">Select Role</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="INSPECTOR">INSPECTOR</option>
                  <option value="ENGINEER">ENGINEER</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  value={editUser.Account_status}
                  onChange={(e) =>
                    setEditUser({ ...editUser, Account_status: e.target.value })
                  }
                  required
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                    setEditUser({
                      name: "",
                      email: "",
                      username: "",
                      password: "",
                      role: "",
                      Account_status: "",
                    });
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium shadow-sm"
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}