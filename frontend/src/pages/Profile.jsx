/**
 * Profile.jsx
 * -----------
 * User profile page.
 * - Shows current profile info via ProfileCard
 * - Allows editing profile details
 * - Allows changing password
 *
 * BACKEND INTEGRATION:
 *   - GET /users/me — fetch current user profile
 *   - PUT /users/me — update profile fields
 *   - POST /users/me/change-password — change password
 */

import { useState, useEffect } from "react";
import { getUserProfile, updateUserProfile } from "../services/userService";
import ProfileCard from "../components/ProfileCard";
import Loader from "../components/Loader";

const Profile = () => {
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [editMode, setEditMode] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    bio:       "",
    skills:    "", // comma-separated string for input; split on save
  });

  // ─── Fetch Profile ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // TODO (Backend): GET /users/me
        const data = await getUserProfile();
        setProfile(data);
        setFormData({
          full_name: data.full_name || "",
          bio:       data.bio       || "",
          skills:    (data.skills || []).join(", "),
        });
      } catch (err) {
        setError("Failed to load profile.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ─── Save Profile ───────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      // TODO (Backend): PUT /users/me
      // skills is sent as an array; split the comma-separated input string
      const updated = await updateUserProfile({
        full_name: formData.full_name,
        bio:       formData.bio,
        skills:    formData.skills.split(",").map((s) => s.trim()).filter(Boolean),
      });
      setProfile(updated);
      setEditMode(false);
      setSuccess("Profile updated successfully!");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader fullScreen message="Loading profile..." />;

  return (
    <div className="page page--profile">
      <div className="page-header">
        <h1 className="page-header__title">My Profile</h1>
      </div>

      {error   && <p className="alert alert--error">{error}</p>}
      {success && <p className="alert alert--success">{success}</p>}

      {/* Profile Card */}
      <ProfileCard user={profile} />

      {/* Edit Toggle */}
      <button
        className="btn btn--outline"
        style={{ marginTop: "1.5rem" }}
        onClick={() => setEditMode((prev) => !prev)}
      >
        {editMode ? "Cancel Editing" : "Edit Profile"}
      </button>

      {/* Edit Form */}
      {editMode && (
        <form className="profile-form" onSubmit={handleSave} style={{ marginTop: "1.5rem" }}>
          <div className="form-group">
            <label htmlFor="full_name" className="form-label">Full Name</label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              className="form-input"
              value={formData.full_name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="bio" className="form-label">Bio</label>
            <textarea
              id="bio"
              name="bio"
              className="form-input form-textarea"
              rows={3}
              placeholder="Tell us about yourself..."
              value={formData.bio}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="skills" className="form-label">Skills (comma-separated)</label>
            <input
              id="skills"
              name="skills"
              type="text"
              className="form-input"
              placeholder="e.g. Python, React, SQL"
              value={formData.skills}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            id="profile-save-btn"
            className="btn btn--primary"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      )}
    </div>
  );
};

export default Profile;
