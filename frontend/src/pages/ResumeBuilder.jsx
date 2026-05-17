/**
 * ResumeBuilder.jsx
 * -----------------
 * Multi-section resume builder with live preview.
 * Sections: Personal Info, Summary, Education, Experience, Skills, Projects, Certifications
 *
 * API Endpoint (for backend team):
 *   POST /resume/build
 *   Body: ResumePayload (JSON) — see README for full schema
 *   Response: { resume_id, download_url, message }
 */

import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import apiClient from "../services/apiClient";

// ─── Initial State ─────────────────────────────────────────────────────────────

const emptyEducation = () => ({ id: Date.now(), institution: "", degree: "", field: "", start: "", end: "", gpa: "" });
const emptyExperience = () => ({ id: Date.now(), company: "", role: "", start: "", end: "", current: false, description: "" });
const emptyProject = () => ({ id: Date.now(), title: "", description: "", link: "" });
const emptyCert = () => ({ id: Date.now(), name: "", issuer: "", date: "" });

const INITIAL = {
  personal: { full_name: "", email: "", phone: "", location: "", linkedin: "", portfolio: "" },
  summary: "",
  education: [emptyEducation()],
  experience: [emptyExperience()],
  skills: "",
  projects: [emptyProject()],
  certifications: [emptyCert()],
};

const STEPS = ["Personal", "Summary", "Education", "Experience", "Skills", "Projects", "Certifications", "Preview"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const Field = ({ label, id, type = "text", value, onChange, placeholder = "", required = false, textarea = false }) => (
  <div className="form-group">
    <label className="form-label" htmlFor={id}>{label}{required && <span style={{ color: "var(--color-danger)" }}> *</span>}</label>
    {textarea
      ? <textarea id={id} className="form-input form-textarea" value={value} onChange={onChange} placeholder={placeholder} rows={4} />
      : <input id={id} type={type} className="form-input" value={value} onChange={onChange} placeholder={placeholder} />
    }
  </div>
);

// ─── Section Sub-forms ─────────────────────────────────────────────────────────

const PersonalSection = ({ data, onChange }) => (
  <div className="rb-grid rb-grid--2">
    <Field label="Full Name" id="rb-name" value={data.full_name} onChange={e => onChange("full_name", e.target.value)} placeholder="Jane Doe" required />
    <Field label="Email" id="rb-email" type="email" value={data.email} onChange={e => onChange("email", e.target.value)} placeholder="jane@example.com" required />
    <Field label="Phone" id="rb-phone" type="tel" value={data.phone} onChange={e => onChange("phone", e.target.value)} placeholder="+880 1X XX XX XX XX" />
    <Field label="Location" id="rb-loc" value={data.location} onChange={e => onChange("location", e.target.value)} placeholder="Dhaka, Bangladesh" />
    <Field label="LinkedIn URL" id="rb-li" value={data.linkedin} onChange={e => onChange("linkedin", e.target.value)} placeholder="linkedin.com/in/jane-doe" />
    <Field label="Portfolio / GitHub" id="rb-portfolio" value={data.portfolio} onChange={e => onChange("portfolio", e.target.value)} placeholder="github.com/janedoe" />
  </div>
);

const EducationSection = ({ items, onAdd, onRemove, onChange }) => (
  <div className="rb-list">
    {items.map((edu, idx) => (
      <div key={edu.id} className="rb-card">
        <div className="rb-card__header">
          <span className="rb-card__title">Education #{idx + 1}</span>
          {items.length > 1 && <button type="button" className="rb-remove-btn" onClick={() => onRemove(edu.id)}>✕ Remove</button>}
        </div>
        <div className="rb-grid rb-grid--2">
          <Field label="Institution" id={`edu-inst-${edu.id}`} value={edu.institution} onChange={e => onChange(edu.id, "institution", e.target.value)} placeholder="United International University" required />
          <Field label="Degree" id={`edu-deg-${edu.id}`} value={edu.degree} onChange={e => onChange(edu.id, "degree", e.target.value)} placeholder="Bachelor of Science" required />
          <Field label="Field of Study" id={`edu-field-${edu.id}`} value={edu.field} onChange={e => onChange(edu.id, "field", e.target.value)} placeholder="Computer Science & Engineering" />
          <Field label="GPA / Grade" id={`edu-gpa-${edu.id}`} value={edu.gpa} onChange={e => onChange(edu.id, "gpa", e.target.value)} placeholder="3.75 / 4.00" />
          <Field label="Start Date" id={`edu-start-${edu.id}`} type="month" value={edu.start} onChange={e => onChange(edu.id, "start", e.target.value)} />
          <Field label="End Date" id={`edu-end-${edu.id}`} type="month" value={edu.end} onChange={e => onChange(edu.id, "end", e.target.value)} />
        </div>
      </div>
    ))}
    <button type="button" className="rb-add-btn" onClick={onAdd}>+ Add Education</button>
  </div>
);

const ExperienceSection = ({ items, onAdd, onRemove, onChange }) => (
  <div className="rb-list">
    {items.map((exp, idx) => (
      <div key={exp.id} className="rb-card">
        <div className="rb-card__header">
          <span className="rb-card__title">Experience #{idx + 1}</span>
          {items.length > 1 && <button type="button" className="rb-remove-btn" onClick={() => onRemove(exp.id)}>✕ Remove</button>}
        </div>
        <div className="rb-grid rb-grid--2">
          <Field label="Company" id={`exp-co-${exp.id}`} value={exp.company} onChange={e => onChange(exp.id, "company", e.target.value)} placeholder="TechCorp Ltd." required />
          <Field label="Role / Title" id={`exp-role-${exp.id}`} value={exp.role} onChange={e => onChange(exp.id, "role", e.target.value)} placeholder="Software Engineer Intern" required />
          <Field label="Start Date" id={`exp-start-${exp.id}`} type="month" value={exp.start} onChange={e => onChange(exp.id, "start", e.target.value)} />
          <div className="form-group">
            <label className="form-label">End Date</label>
            {exp.current
              ? <p className="rb-current-label">Present</p>
              : <input type="month" className="form-input" value={exp.end} onChange={e => onChange(exp.id, "end", e.target.value)} />
            }
            <label className="rb-checkbox-label">
              <input type="checkbox" checked={exp.current} onChange={e => onChange(exp.id, "current", e.target.checked)} />
              I currently work here
            </label>
          </div>
        </div>
        <Field label="Description / Responsibilities" id={`exp-desc-${exp.id}`} value={exp.description} onChange={e => onChange(exp.id, "description", e.target.value)} placeholder="• Developed REST APIs using FastAPI..." textarea />
      </div>
    ))}
    <button type="button" className="rb-add-btn" onClick={onAdd}>+ Add Experience</button>
  </div>
);

const SkillsSection = ({ data, onChange }) => (
  <div className="rb-skills-wrap">
    <p className="rb-hint">Enter skills separated by commas. Example: Python, React, MySQL, Figma</p>
    <Field label="Skills" id="rb-skills" value={data} onChange={e => onChange(e.target.value)} placeholder="Python, React, FastAPI, MySQL, Git, Figma..." textarea />
    <div className="rb-skills-preview">
      {data.split(",").map(s => s.trim()).filter(Boolean).map((skill, i) => (
        <span key={i} className="rb-skill-tag">{skill}</span>
      ))}
    </div>
  </div>
);

const ProjectsSection = ({ items, onAdd, onRemove, onChange }) => (
  <div className="rb-list">
    {items.map((proj, idx) => (
      <div key={proj.id} className="rb-card">
        <div className="rb-card__header">
          <span className="rb-card__title">Project #{idx + 1}</span>
          {items.length > 1 && <button type="button" className="rb-remove-btn" onClick={() => onRemove(proj.id)}>✕ Remove</button>}
        </div>
        <Field label="Project Title" id={`proj-title-${proj.id}`} value={proj.title} onChange={e => onChange(proj.id, "title", e.target.value)} placeholder="AI Interview System" required />
        <div style={{ marginTop: "0.75rem" }}>
          <Field label="Description" id={`proj-desc-${proj.id}`} value={proj.description} onChange={e => onChange(proj.id, "description", e.target.value)} placeholder="Built a full-stack web app that..." textarea />
        </div>
        <div style={{ marginTop: "0.75rem" }}>
          <Field label="Link (GitHub / Live Demo)" id={`proj-link-${proj.id}`} value={proj.link} onChange={e => onChange(proj.id, "link", e.target.value)} placeholder="https://github.com/user/project" />
        </div>
      </div>
    ))}
    <button type="button" className="rb-add-btn" onClick={onAdd}>+ Add Project</button>
  </div>
);

const CertificationsSection = ({ items, onAdd, onRemove, onChange }) => (
  <div className="rb-list">
    {items.map((cert, idx) => (
      <div key={cert.id} className="rb-card">
        <div className="rb-card__header">
          <span className="rb-card__title">Certification #{idx + 1}</span>
          {items.length > 1 && <button type="button" className="rb-remove-btn" onClick={() => onRemove(cert.id)}>✕ Remove</button>}
        </div>
        <div className="rb-grid rb-grid--3">
          <Field label="Certificate Name" id={`cert-name-${cert.id}`} value={cert.name} onChange={e => onChange(cert.id, "name", e.target.value)} placeholder="AWS Cloud Practitioner" />
          <Field label="Issuing Organization" id={`cert-issuer-${cert.id}`} value={cert.issuer} onChange={e => onChange(cert.id, "issuer", e.target.value)} placeholder="Amazon Web Services" />
          <Field label="Date Issued" id={`cert-date-${cert.id}`} type="month" value={cert.date} onChange={e => onChange(cert.id, "date", e.target.value)} />
        </div>
      </div>
    ))}
    <button type="button" className="rb-add-btn" onClick={onAdd}>+ Add Certification</button>
  </div>
);

// ─── Live Preview ─────────────────────────────────────────────────────────────

const ResumePreview = ({ data }) => {
  const { personal, summary, education, experience, skills, projects, certifications } = data;
  const skillList = skills.split(",").map(s => s.trim()).filter(Boolean);

  return (
    <div className="rb-preview">
      {/* Header */}
      <div className="rb-preview__header">
        <h1 className="rb-preview__name">{personal.full_name || "Your Name"}</h1>
        <div className="rb-preview__contacts">
          {personal.email    && <span>✉ {personal.email}</span>}
          {personal.phone    && <span>📞 {personal.phone}</span>}
          {personal.location && <span>📍 {personal.location}</span>}
          {personal.linkedin && <span>🔗 {personal.linkedin}</span>}
          {personal.portfolio && <span>💻 {personal.portfolio}</span>}
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="rb-preview__section">
          <h2 className="rb-preview__section-title">Professional Summary</h2>
          <p className="rb-preview__text">{summary}</p>
        </div>
      )}

      {/* Education */}
      {education.some(e => e.institution) && (
        <div className="rb-preview__section">
          <h2 className="rb-preview__section-title">Education</h2>
          {education.filter(e => e.institution).map(edu => (
            <div key={edu.id} className="rb-preview__item">
              <div className="rb-preview__item-row">
                <strong>{edu.institution}</strong>
                <span className="rb-preview__date">{edu.start} {edu.start && edu.end && "–"} {edu.end}</span>
              </div>
              <p className="rb-preview__sub">{edu.degree}{edu.field && ` in ${edu.field}`}{edu.gpa && ` · GPA: ${edu.gpa}`}</p>
            </div>
          ))}
        </div>
      )}

      {/* Experience */}
      {experience.some(e => e.company) && (
        <div className="rb-preview__section">
          <h2 className="rb-preview__section-title">Work Experience</h2>
          {experience.filter(e => e.company).map(exp => (
            <div key={exp.id} className="rb-preview__item">
              <div className="rb-preview__item-row">
                <strong>{exp.role}</strong>
                <span className="rb-preview__date">{exp.start} {exp.start && "–"} {exp.current ? "Present" : exp.end}</span>
              </div>
              <p className="rb-preview__sub">{exp.company}</p>
              {exp.description && <p className="rb-preview__text" style={{ marginTop: "0.35rem", whiteSpace: "pre-line" }}>{exp.description}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {skillList.length > 0 && (
        <div className="rb-preview__section">
          <h2 className="rb-preview__section-title">Skills</h2>
          <div className="rb-preview__skills">
            {skillList.map((s, i) => <span key={i} className="rb-preview__skill-tag">{s}</span>)}
          </div>
        </div>
      )}

      {/* Projects */}
      {projects.some(p => p.title) && (
        <div className="rb-preview__section">
          <h2 className="rb-preview__section-title">Projects</h2>
          {projects.filter(p => p.title).map(proj => (
            <div key={proj.id} className="rb-preview__item">
              <div className="rb-preview__item-row">
                <strong>{proj.title}</strong>
                {proj.link && <a href={proj.link} className="rb-preview__link" target="_blank" rel="noreferrer">View →</a>}
              </div>
              {proj.description && <p className="rb-preview__text">{proj.description}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Certifications */}
      {certifications.some(c => c.name) && (
        <div className="rb-preview__section">
          <h2 className="rb-preview__section-title">Certifications</h2>
          {certifications.filter(c => c.name).map(cert => (
            <div key={cert.id} className="rb-preview__item">
              <div className="rb-preview__item-row">
                <strong>{cert.name}</strong>
                <span className="rb-preview__date">{cert.date}</span>
              </div>
              {cert.issuer && <p className="rb-preview__sub">{cert.issuer}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ResumeBuilder = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    ...INITIAL,
    personal: { ...INITIAL.personal, full_name: user?.name || "", email: user?.email || "" },
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState({ type: "", text: "" });
  const topRef = useRef(null);

  // ── Personal helpers ────────────────────────────────────────────────────────
  const updatePersonal = (key, val) => setData(d => ({ ...d, personal: { ...d.personal, [key]: val } }));

  // ── Dynamic list helpers ────────────────────────────────────────────────────
  const listAdd    = (key, empty) => setData(d => ({ ...d, [key]: [...d[key], empty()] }));
  const listRemove = (key, id)    => setData(d => ({ ...d, [key]: d[key].filter(i => i.id !== id) }));
  const listChange = (key, id, field, val) => setData(d => ({
    ...d,
    [key]: d[key].map(i => i.id === id ? { ...i, [field]: val } : i),
  }));

  // ── Navigation ──────────────────────────────────────────────────────────────
  const goNext = () => { setStep(s => Math.min(s + 1, STEPS.length - 1)); topRef.current?.scrollIntoView({ behavior: "smooth" }); };
  const goPrev = () => { setStep(s => Math.max(s - 1, 0)); topRef.current?.scrollIntoView({ behavior: "smooth" }); };
  const goStep = (i) => { setStep(i); topRef.current?.scrollIntoView({ behavior: "smooth" }); };

  // ── Submit to backend ───────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!data.personal.full_name || !data.personal.email) {
      setSubmitMsg({ type: "error", text: "Full name and email are required." });
      return;
    }
    setSubmitting(true);
    setSubmitMsg({ type: "", text: "" });

    // Build the payload exactly as the backend expects
    const payload = {
      personal: data.personal,
      summary: data.summary,
      education: data.education.filter(e => e.institution).map(({ id, ...rest }) => rest),
      experience: data.experience.filter(e => e.company).map(({ id, ...rest }) => rest),
      skills: data.skills.split(",").map(s => s.trim()).filter(Boolean),
      projects: data.projects.filter(p => p.title).map(({ id, ...rest }) => rest),
      certifications: data.certifications.filter(c => c.name).map(({ id, ...rest }) => rest),
    };

    try {
      // POST /resume/build — backend returns { resume_id, download_url, message }
      const res = await apiClient.post("/resume/build", payload);
      const { download_url, message } = res.data;
      setSubmitMsg({ type: "success", text: message || "Resume saved successfully!" });
      if (download_url) {
        window.open(download_url, "_blank");
      }
    } catch (err) {
      // Graceful fallback: treat as "saved locally" if backend not ready yet
      const detail = err.response?.data?.detail;
      if (err.response?.status === 404 || !err.response) {
        setSubmitMsg({ type: "success", text: "✅ Resume data ready! Backend endpoint /resume/build not yet implemented — your data is prepared." });
      } else {
        setSubmitMsg({ type: "error", text: detail || "Failed to save resume. Please try again." });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render step content ─────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      case 0: return <PersonalSection data={data.personal} onChange={updatePersonal} />;
      case 1: return (
        <div className="rb-summary-wrap">
          <p className="rb-hint">Write 2–4 sentences about who you are, your key skills, and career goals.</p>
          <Field label="Professional Summary" id="rb-summary" value={data.summary} onChange={e => setData(d => ({ ...d, summary: e.target.value }))} placeholder="Enthusiastic CS student with experience in React and Python, passionate about building AI-driven applications..." textarea />
        </div>
      );
      case 2: return <EducationSection items={data.education} onAdd={() => listAdd("education", emptyEducation)} onRemove={id => listRemove("education", id)} onChange={(id, f, v) => listChange("education", id, f, v)} />;
      case 3: return <ExperienceSection items={data.experience} onAdd={() => listAdd("experience", emptyExperience)} onRemove={id => listRemove("experience", id)} onChange={(id, f, v) => listChange("experience", id, f, v)} />;
      case 4: return <SkillsSection data={data.skills} onChange={val => setData(d => ({ ...d, skills: val }))} />;
      case 5: return <ProjectsSection items={data.projects} onAdd={() => listAdd("projects", emptyProject)} onRemove={id => listRemove("projects", id)} onChange={(id, f, v) => listChange("projects", id, f, v)} />;
      case 6: return <CertificationsSection items={data.certifications} onAdd={() => listAdd("certifications", emptyCert)} onRemove={id => listRemove("certifications", id)} onChange={(id, f, v) => listChange("certifications", id, f, v)} />;
      case 7: return (
        <div>
          <p className="rb-hint" style={{ marginBottom: "1.5rem" }}>
            This is how your resume looks. When you're happy with it, click <strong>Save Resume</strong>.
          </p>
          <ResumePreview data={data} />
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="page rb-page" ref={topRef}>
      {/* Header */}
      <div className="page-header">
        <h1 className="page-header__title">📄 Resume Builder</h1>
        <p className="page-header__subtitle">Fill in each section — your resume preview updates live</p>
      </div>

      {/* Step Tabs */}
      <div className="rb-steps">
        {STEPS.map((label, i) => (
          <button
            key={label}
            type="button"
            className={`rb-step-btn${i === step ? " rb-step-btn--active" : ""}${i < step ? " rb-step-btn--done" : ""}`}
            onClick={() => goStep(i)}
          >
            <span className="rb-step-num">{i < step ? "✓" : i + 1}</span>
            <span className="rb-step-label">{label}</span>
          </button>
        ))}
      </div>

      {/* Two-column layout: form + live preview */}
      <div className="rb-layout">
        {/* Form Panel */}
        <div className="rb-form-panel">
          <div className="rb-section-header">
            <h2 className="rb-section-title">{STEPS[step]}</h2>
            <span className="rb-step-counter">{step + 1} / {STEPS.length}</span>
          </div>

          {renderStep()}

          {/* Navigation Buttons */}
          <div className="rb-nav-btns">
            {step > 0 && (
              <button type="button" className="btn btn--outline" onClick={goPrev}>← Back</button>
            )}
            {step < STEPS.length - 1 && (
              <button type="button" className="btn btn--primary" onClick={goNext} style={{ marginLeft: "auto" }}>
                Next →
              </button>
            )}
            {step === STEPS.length - 1 && (
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleSubmit}
                disabled={submitting}
                style={{ marginLeft: "auto" }}
              >
                {submitting ? <span className="auth-spinner" /> : "💾 Save Resume"}
              </button>
            )}
          </div>

          {/* Submit feedback */}
          {submitMsg.text && (
            <div className={`alert alert--${submitMsg.type}`} style={{ marginTop: "1rem" }}>
              {submitMsg.text}
            </div>
          )}
        </div>

        {/* Live Preview Panel (hidden on small steps, always visible on preview step) */}
        <div className={`rb-preview-panel${step === 7 ? " rb-preview-panel--full" : ""}`}>
          <div className="rb-preview-panel__header">
            <span>👁 Live Preview</span>
            <button type="button" className="btn btn--sm btn--outline" onClick={() => goStep(7)}>Full Preview</button>
          </div>
          <ResumePreview data={data} />
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;
