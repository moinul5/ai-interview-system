/**
 * ProfileCard.jsx
 * ---------------
 * Displays user profile information in a card format.
 *
 * Props:
 *   user {Object} - User object from the backend:
 *     { full_name, email, avatar_url?, bio?, skills?: string[] }
 *
 * TODO (Backend): This component expects the shape returned by GET /users/me
 *   Adjust field names to match your actual API response.
 */

const ProfileCard = ({ user }) => {
  if (!user) return null;

  const {
    full_name = "Unknown User",
    email     = "",
    avatar_url,
    bio       = "No bio provided.",
    skills    = [],
  } = user;

  // Fallback avatar using initials
  const initials = full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="profile-card">
      {/* Avatar */}
      <div className="profile-card__avatar">
        {avatar_url ? (
          <img src={avatar_url} alt={`${full_name}'s avatar`} className="profile-card__avatar-img" />
        ) : (
          <span className="profile-card__avatar-initials">{initials}</span>
        )}
      </div>

      {/* Info */}
      <div className="profile-card__info">
        <h2 className="profile-card__name">{full_name}</h2>
        <p className="profile-card__email">{email}</p>
        <p className="profile-card__bio">{bio}</p>
      </div>

      {/* Skills */}
      {skills.length > 0 && (
        <div className="profile-card__skills">
          <h3 className="profile-card__skills-label">Skills</h3>
          <ul className="profile-card__skills-list">
            {skills.map((skill, i) => (
              <li key={i} className="profile-card__skill-tag">{skill}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ProfileCard;
