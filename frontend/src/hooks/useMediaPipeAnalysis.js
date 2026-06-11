/**
 * useMediaPipeAnalysis.js
 * -----------------------
 * Custom React hook using locally installed @mediapipe/tasks-vision (npm package).
 * NO CDN required — works offline and behind firewalls.
 *
 * Tracked metrics (per frame, ~6 fps):
 *   - Eye contact:      gaze direction toward camera (nose-eye horizontal asymmetry)
 *   - Face visibility:  whether a face is detected in the frame
 *   - Head stability:   nose landmark displacement variance between frames
 *
 * Install requirement:
 *   npm install @mediapipe/tasks-vision
 *
 * Vite config requirement (vite.config.js):
 *   optimizeDeps: { exclude: ['@mediapipe/tasks-vision'] }
 */

import { useCallback, useEffect, useRef, useState } from "react";

// WASM files copied to public/mediapipe/ — works in both dev and production
const WASM_PATH = "/mediapipe";

// Model hosted by Google (small download ~2MB, only on first use)
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

// Analysis config
const FRAME_INTERVAL_MS  = 150;   // ~6 fps — lightweight enough for the main thread
const EYE_YAW_THRESHOLD  = 0.35;  // nose offset / eye-width ratio; below = looking at camera
const MAX_HEAD_MOVEMENT  = 0.06;  // normalized nose displacement; above = head moved

// ─── Metric Tracker ───────────────────────────────────────────────────────────
class MetricTracker {
  constructor() { this.reset(); }

  reset() {
    this.totalFrames       = 0;
    this.faceVisibleFrames = 0;
    this.eyeContactFrames  = 0;
    this.prevNoseX         = null;
    this.prevNoseY         = null;
    this.headMovements     = [];
  }

  processLandmarks(landmarks) {
    this.totalFrames++;

    if (!landmarks || landmarks.length === 0) {
      return { faceDetected: false, eyeContact: false };
    }

    this.faceVisibleFrames++;
    const face = landmarks[0];

    // ── Eye Contact ──────────────────────────────────────────────────────────
    // Landmark indices (MediaPipe 478-point model):
    //   33  = left eye outer corner
    //   263 = right eye outer corner
    //   1   = nose tip
    // Logic: if nose is close to the horizontal midpoint between the eyes,
    //        the person is looking straight forward (at the camera).
    const leftEye  = face[33];
    const rightEye = face[263];
    const nose     = face[1];

    let eyeContact = false;
    if (leftEye && rightEye && nose) {
      const eyeMidX   = (leftEye.x + rightEye.x) / 2;
      const eyeWidth  = Math.abs(rightEye.x - leftEye.x);
      const noseRatio = eyeWidth > 0 ? Math.abs(nose.x - eyeMidX) / eyeWidth : 1;
      eyeContact = noseRatio < EYE_YAW_THRESHOLD;
    }
    if (eyeContact) this.eyeContactFrames++;

    // ── Head Stability ───────────────────────────────────────────────────────
    // Track how much the nose tip moves between consecutive frames
    if (nose && this.prevNoseX !== null) {
      const dx = nose.x - this.prevNoseX;
      const dy = nose.y - this.prevNoseY;
      this.headMovements.push(Math.sqrt(dx * dx + dy * dy));
    }
    if (nose) {
      this.prevNoseX = nose.x;
      this.prevNoseY = nose.y;
    }

    return { faceDetected: true, eyeContact };
  }

  getScores() {
    const total = Math.max(this.totalFrames, 1);

    const faceVisibilityScore = Math.round((this.faceVisibleFrames / total) * 100);
    const eyeContactScore     = Math.round((this.eyeContactFrames  / total) * 100);

    // Head stability:
    //  - No face ever detected         → 0   (no data, not meaningful)
    //  - Face detected, ≤1 frame       → 100 (no movement to measure, assume stable)
    //  - Face detected, multiple frames → % of movements below threshold
    let headStabilityScore;
    if (this.faceVisibleFrames === 0) {
      headStabilityScore = 0;
    } else if (this.headMovements.length === 0) {
      headStabilityScore = 100;
    } else {
      const stable = this.headMovements.filter(m => m < MAX_HEAD_MOVEMENT).length;
      headStabilityScore = Math.round((stable / this.headMovements.length) * 100);
    }

    return {
      eye_contact_score:     Math.min(100, eyeContactScore),
      face_visibility_score: Math.min(100, faceVisibilityScore),
      head_stability_score:  Math.min(100, headStabilityScore),
      total_frames:          this.totalFrames,
      face_visible_frames:   this.faceVisibleFrames,
    };
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useMediaPipeAnalysis(videoRef) {
  const [isReady,     setIsReady]     = useState(false);
  const [loadError,   setLoadError]   = useState(null);
  const [liveMetrics, setLiveMetrics] = useState({
    eye_contact_score:     0,
    face_visibility_score: 0,
    head_stability_score:  0,
    faceDetected:          false,
    eyeContact:            false,
  });

  const landmarkerRef = useRef(null);
  const trackerRef    = useRef(new MetricTracker());
  const rafRef        = useRef(null);
  const runningRef    = useRef(false);
  const lastFrameTs   = useRef(0);

  // ── Load MediaPipe from npm package on mount ──────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // Dynamic import from locally installed package (no CDN needed)
        const vision = await import("@mediapipe/tasks-vision");
        const { FaceLandmarker, FilesetResolver } = vision;

        if (!FaceLandmarker || !FilesetResolver) {
          throw new Error("FaceLandmarker or FilesetResolver not exported from @mediapipe/tasks-vision");
        }

        const fileSet = await FilesetResolver.forVisionTasks(WASM_PATH);

        const landmarker = await FaceLandmarker.createFromOptions(fileSet, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate: "GPU",
          },
          outputFaceBlendshapes: false,
          runningMode: "VIDEO",
          numFaces: 1,
        });

        if (!cancelled) {
          landmarkerRef.current = landmarker;
          setIsReady(true);
          setLoadError(null);
          console.log("[MediaPipe] FaceLandmarker initialized successfully.");
        }
      } catch (err) {
        if (!cancelled) {
          console.warn("[MediaPipe] Failed to initialize:", err.message);
          setLoadError(err.message);
          // Still mark ready — interview proceeds with transcript-only analysis
          setIsReady(true);
        }
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  // ── Frame analysis loop ───────────────────────────────────────────────────
  const analyzeFrame = useCallback(() => {
    if (!runningRef.current) return;

    const video      = videoRef.current;
    const landmarker = landmarkerRef.current;
    const now        = performance.now();

    if (
      video &&
      video.readyState >= 2 &&
      !video.paused &&
      landmarker &&
      now - lastFrameTs.current >= FRAME_INTERVAL_MS
    ) {
      lastFrameTs.current = now;
      try {
        const results     = landmarker.detectForVideo(video, now);
        const frameResult = trackerRef.current.processLandmarks(results?.faceLandmarks);
        const scores      = trackerRef.current.getScores();
        setLiveMetrics({ ...scores, ...frameResult });
      } catch (_) {
        // Skip bad frames silently
      }
    }

    rafRef.current = requestAnimationFrame(analyzeFrame);
  }, [videoRef]);

  const startAnalysis = useCallback(() => {
    trackerRef.current.reset();
    runningRef.current  = true;
    lastFrameTs.current = 0;
    rafRef.current = requestAnimationFrame(analyzeFrame);
  }, [analyzeFrame]);

  const stopAnalysis = useCallback(() => {
    runningRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const getMetrics = useCallback(() => trackerRef.current.getScores(), []);

  const resetMetrics = useCallback(() => {
    trackerRef.current.reset();
    setLiveMetrics({
      eye_contact_score:     0,
      face_visibility_score: 0,
      head_stability_score:  0,
      faceDetected:          false,
      eyeContact:            false,
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => () => { stopAnalysis(); }, [stopAnalysis]);

  return {
    isReady,
    loadError,
    liveMetrics,
    startAnalysis,
    stopAnalysis,
    getMetrics,
    resetMetrics,
  };
}
