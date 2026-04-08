import { useState, useEffect, useCallback } from "react";

/**
 * Manages microphone permission with an explicit Android-friendly prompt.
 *
 * Returns:
 *   micPermission  – "granted" | "denied" | "prompt" | "unsupported"
 *   requestMic     – async fn: opens the OS dialog if needed, returns a MediaStream or null
 *   permError      – human-readable error string (or null)
 */
export const useMicrophonePermission = () => {
  const [micPermission, setMicPermission] = useState("prompt"); // default – we'll update below
  const [permError, setPermError] = useState(null);

  // Query current state without triggering the prompt
  useEffect(() => {
    if (!navigator?.permissions?.query) {
      // Permissions API not supported (some Android WebViews) — treat as "prompt"
      setMicPermission("prompt");
      return;
    }
    navigator.permissions
      .query({ name: "microphone" })
      .then((result) => {
        setMicPermission(result.state); // "granted" | "denied" | "prompt"
        result.onchange = () => setMicPermission(result.state);
      })
      .catch(() => setMicPermission("prompt"));
  }, []);

  /**
   * Request microphone access. Triggers the Android OS permission dialog when
   * permission state is "prompt". Returns a live MediaStream on success,
   * or null on failure.
   */
  const requestMic = useCallback(async () => {
    setPermError(null);
    if (!navigator?.mediaDevices?.getUserMedia) {
      setPermError("Your browser does not support microphone access.");
      setMicPermission("unsupported");
      return null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
        video: false,
      });
      setMicPermission("granted");
      return stream;
    } catch (err) {
      console.error("Mic permission error:", err.name, err.message);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setMicPermission("denied");
        setPermError(
          "Microphone permission was denied. Please allow microphone access in your browser/app settings and try again."
        );
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setPermError("No microphone found. Please connect a microphone and try again.");
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        setPermError("Microphone is in use by another app. Please close it and try again.");
      } else {
        setPermError(`Microphone error: ${err.message}`);
      }
      return null;
    }
  }, []);

  return { micPermission, requestMic, permError };
};
