/**
 * UserManagement.jsx
 * ------------------
 * Admin user management page with search, filter, CRUD modals.
 */

import { useState, useEffect, useCallback } from "react";
import {
  MdAdd,
  MdEdit,
  MdLockReset,
  MdSearch,
  MdClose,
  MdPeople,
} from "react-icons/md";
import { getUsers, createUser, updateUser, resetPassword } from "../../services/adminService";

const ROLES = ["candidate", "interviewer", "admin"];

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "candidate" });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const { data } = await getUsers(params);
      setUsers(data.users ?? data ?? []);
    } catch {
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleFormChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);
    try {
      await createUser(formData);
      setShowAddModal(false);
      setFormData({ name: "", email: "", password: "", role: "candidate" });
      fetchUsers();
    } catch (err) {
      setFormError(err.response?.data?.detail || "Failed to create user.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editUser) return;
    setFormError("");
    setFormLoading(true);
    try {
      await updateUser(editUser.id, {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      });
      setShowEditModal(false);
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      setFormError(err.response?.data?.detail || "Failed to update user.");
    } finally {
      setFormLoading(false);
    }
  };

  const openEditModal = (user) => {
    setEditUser(user);
    setFormData({ name: user.name, email: user.email, password: "", role: user.role });
    setFormError("");
    setShowEditModal(true);
  };

  const handleResetPassword = async (user) => {
    if (!window.confirm(`Reset password for ${user.name}?`)) return;
    try {
      await resetPassword(user.id, { new_password: "TempPass123!" });
      alert("Password reset to: TempPass123!");
    } catch {
      alert("Failed to reset password.");
    }
  };

  const openAddModal = () => {
    setFormData({ name: "", email: "", password: "", role: "candidate" });
    setFormError("");
    setShowAddModal(true);
  };

  return (
    <div className="page">
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 className="page-header__title">User Management</h1>
          <p className="page-header__subtitle">Manage all system users</p>
        </div>
        <button className="btn btn--primary" onClick={openAddModal}>
          <MdAdd size={18} /> Add User
        </button>
      </div>

      {/* Search & Filter */}
      <div className="data-table-controls">
        <div className="search-bar">
          <MdSearch size={18} />
          <input
            type="text"
            className="form-input"
            placeholder="Search users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-input form-select"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{ maxWidth: "180px" }}
        >
          <option value="">All Roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      {loading ? (
        <div className="loader">
          <div className="loader__spinner" />
          <span className="loader__message">Loading users…</span>
        </div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <MdPeople size={40} />
          <p>No users found</p>
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="data-table__cell--name">{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`role-badge role-badge--${u.role}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="data-table__actions">
                      <button
                        className="action-btn action-btn--primary btn--sm"
                        onClick={() => openEditModal(u)}
                        title="Edit"
                      >
                        <MdEdit size={15} />
                      </button>
                      <button
                        className="action-btn action-btn--warning btn--sm"
                        onClick={() => handleResetPassword(u)}
                        title="Reset Password"
                      >
                        <MdLockReset size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New User</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <MdClose size={20} />
              </button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                {formError && <div className="alert alert--error">{formError}</div>}
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input
                    name="name"
                    className="form-input"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    name="email"
                    type="email"
                    className="form-input"
                    value={formData.email}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    name="password"
                    type="password"
                    className="form-input"
                    value={formData.password}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select
                    name="role"
                    className="form-input form-select"
                    value={formData.role}
                    onChange={handleFormChange}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn--outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary" disabled={formLoading}>
                  {formLoading ? "Creating…" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit User</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                <MdClose size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                {formError && <div className="alert alert--error">{formError}</div>}
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input
                    name="name"
                    className="form-input"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    name="email"
                    type="email"
                    className="form-input"
                    value={formData.email}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select
                    name="role"
                    className="form-input form-select"
                    value={formData.role}
                    onChange={handleFormChange}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn--outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary" disabled={formLoading}>
                  {formLoading ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
