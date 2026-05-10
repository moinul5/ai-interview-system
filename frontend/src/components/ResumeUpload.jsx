/**
 * ResumeUpload.jsx
 * ----------------
 * File upload component for resumes (PDF / DOCX).
 * - Supports drag-and-drop and click-to-upload
 * - Shows upload status and error message
 * - Calls resumeService.uploadResume() on submit
 */

import { useState, useRef } from "react";
import { uploadResume } from "../services/resumeService";
import Loader from "./Loader";
import {
  MdCloudUpload,
  MdInsertDriveFile,
  MdCheckCircle,
  MdErrorOutline,
} from "react-icons/md";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
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

  const onDragOver  = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = ()  => setDragOver(false);

  // ─── Upload ─────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const result = await uploadResume(file);
      setSuccess(true);
      setFile(null);
      if (onUploadSuccess) onUploadSuccess(result);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === "string") {
        setError(detail);
      } else if (detail?.message) {
        setError(`${detail.message}${detail.extracted_character_count !== undefined ? ` (extracted ${detail.extracted_character_count} chars)` : ""}`);
      } else if (Array.isArray(detail) && detail.length > 0) {
        setError(`Validation error: ${detail.map(d => d.msg).join(", ")}`);
      } else if (err.code === "ECONNABORTED") {
        setError("Request timed out. The AI analysis is taking too long — please try again.");
      } else {
        setError(`Upload failed: ${err.response?.status} — ${err.message || "Please try again."}`);
      }
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

        {file ? (
          <MdInsertDriveFile size={40} className="resume-upload__icon" />
        ) : (
          <MdCloudUpload size={40} className="resume-upload__icon" />
        )}

        <p className="resume-upload__hint">
          {file ? file.name : "Drag & drop your resume here, or click to browse"}
        </p>
        <p className="resume-upload__types">PDF or DOCX · Max {MAX_SIZE_MB}MB</p>
      </div>

      {/* Error Message */}
      {error && (
        <p className="resume-upload__error" role="alert">
          <MdErrorOutline size={16} style={{ verticalAlign: "middle", marginRight: "4px" }} />
          {error}
        </p>
      )}

      {/* Success Message */}
      {success && (
        <p className="resume-upload__success">
          <MdCheckCircle size={16} style={{ verticalAlign: "middle", marginRight: "4px" }} />
          Resume uploaded &amp; analyzed successfully!
        </p>
      )}

      {/* Upload Button */}
      {file && !loading && (
        <button className="btn btn--primary resume-upload__btn" onClick={handleUpload}>
          <MdCloudUpload size={16} style={{ verticalAlign: "middle", marginRight: "6px" }} />
          Upload Resume
        </button>
      )}

      {/* Loading State */}
      {loading && <Loader message="Uploading & running AI analysis... (may take 15–30 seconds)" />}
    </div>
  );
};

export default ResumeUpload;
