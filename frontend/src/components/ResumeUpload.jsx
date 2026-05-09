/**
 * ResumeUpload.jsx
 * ----------------
 * File upload component for resumes (PDF / DOCX).
 * - Supports drag-and-drop and click-to-upload
 * - Shows upload status and error message
 * - Calls resumeService.uploadResume() on submit
 *
 * Props:
 *   onUploadSuccess {Function} - Called with the API response after successful upload
 */

import { useState, useRef } from "react";
import { uploadResume } from "../services/resumeService";
import Loader from "./Loader";

const ACCEPTED_TYPES = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const MAX_SIZE_MB = 5;

const ResumeUpload = ({ onUploadSuccess }) => {
  const [file, setFile]         = useState(null);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef                = useRef(null);

  // ─── File Validation ────────────────────────────────────────────────────────
  const validateFile = (f) => {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      return "Only PDF and DOCX files are accepted.";
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File must be smaller than ${MAX_SIZE_MB}MB.`;
    }
    return null;
  };

  const handleFileSelect = (f) => {
    setError("");
    setSuccess(false);
    const validationError = validateFile(f);
    if (validationError) {
      setError(validationError);
      setFile(null);
      return;
    }
    setFile(f);
  };

  // ─── Drag & Drop ────────────────────────────────────────────────────────────
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelect(dropped);
  };

  const onDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = ()  => setDragOver(false);

  // ─── Upload ─────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      // TODO (Backend): POST /resumes/upload with multipart/form-data
      const result = await uploadResume(file);
      setSuccess(true);
      setFile(null);
      if (onUploadSuccess) onUploadSuccess(result);
    } catch (err) {
      // TODO (Backend): Handle specific backend error codes here
      setError(err.response?.data?.detail || "Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="resume-upload">
      {/* Drop Zone */}
      <div
        className={`resume-upload__dropzone ${dragOver ? "resume-upload__dropzone--active" : ""}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
        role="button"
        aria-label="Upload resume file"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          hidden
          onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])}
        />
        <span className="resume-upload__icon">📤</span>
        <p className="resume-upload__hint">
          {file ? file.name : "Drag & drop your resume here, or click to browse"}
        </p>
        <p className="resume-upload__types">PDF or DOCX · Max {MAX_SIZE_MB}MB</p>
      </div>

      {/* Error Message */}
      {error && <p className="resume-upload__error" role="alert">{error}</p>}

      {/* Success Message */}
      {success && <p className="resume-upload__success">✅ Resume uploaded successfully!</p>}

      {/* Upload Button */}
      {file && !loading && (
        <button className="btn btn--primary resume-upload__btn" onClick={handleUpload}>
          Upload Resume
        </button>
      )}

      {/* Loading State */}
      {loading && <Loader message="Uploading your resume..." />}
    </div>
  );
};

export default ResumeUpload;
