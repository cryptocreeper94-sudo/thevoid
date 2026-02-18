/**
 * React hook for voice recording using MediaRecorder API.
 * Records audio with automatic mime type detection and fallbacks.
 */
import { useRef, useCallback, useState } from "react";

export type RecordingState = "idle" | "recording" | "stopped";

const PREFERRED_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
];

function getSupportedMimeType(): string {
  for (const mimeType of PREFERRED_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }
  return "";
}

function getFileExtension(mimeType: string): string {
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("mpeg")) return "mp3";
  return "webm";
}

export interface VoiceRecorderOptions {
  onSilenceDetected?: () => void;
  silenceThreshold?: number;
  silenceTimeout?: number;
}

export function useVoiceRecorder(options?: VoiceRecorderOptions) {
  const [state, setState] = useState<RecordingState>("idle");
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef<string>("");
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const hasSpeechRef = useRef(false);
  const onSilenceRef = useRef(options?.onSilenceDetected);
  onSilenceRef.current = options?.onSilenceDetected;

  const cleanupSilenceDetection = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    hasSpeechRef.current = false;
  }, []);

  const startSilenceDetection = useCallback((stream: MediaStream) => {
    const threshold = options?.silenceThreshold ?? 15;
    const timeout = options?.silenceTimeout ?? 2500;

    try {
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkAudio = () => {
        if (!analyserRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;

        if (average > threshold) {
          hasSpeechRef.current = true;
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
        } else if (hasSpeechRef.current && !silenceTimerRef.current) {
          silenceTimerRef.current = setTimeout(() => {
            if (onSilenceRef.current) {
              onSilenceRef.current();
            }
          }, timeout);
        }

        rafRef.current = requestAnimationFrame(checkAudio);
      };

      rafRef.current = requestAnimationFrame(checkAudio);
    } catch {
    }
  }, [options?.silenceThreshold, options?.silenceTimeout]);

  const startRecording = useCallback(async (enableSilenceDetection?: boolean): Promise<void> => {
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const mimeType = getSupportedMimeType();
      mimeTypeRef.current = mimeType;

      const recorderOptions: MediaRecorderOptions = {};
      if (mimeType) {
        recorderOptions.mimeType = mimeType;
      }

      const recorder = new MediaRecorder(stream, recorderOptions);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onerror = (e) => {
        console.error("MediaRecorder error:", e);
        setError("Recording failed. Please try again.");
        cleanupSilenceDetection();
        setState("idle");
      };

      recorder.start(250);
      setState("recording");

      if (enableSilenceDetection) {
        startSilenceDetection(stream);
      }
    } catch (err: any) {
      console.error("getUserMedia error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setError("Microphone access denied. Please allow microphone permission and try again.");
      } else if (err.name === "NotFoundError") {
        setError("No microphone found. Please connect a microphone and try again.");
      } else {
        setError("Could not access microphone. Please check your device settings.");
      }
      setState("idle");
    }
  }, [startSilenceDetection, cleanupSilenceDetection]);

  const stopRecording = useCallback((): Promise<{ blob: Blob; mimeType: string; extension: string }> => {
    cleanupSilenceDetection();
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state !== "recording") {
        resolve({ blob: new Blob(), mimeType: "", extension: "webm" });
        return;
      }

      recorder.onstop = () => {
        const actualMime = mimeTypeRef.current || recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: actualMime });
        const extension = getFileExtension(actualMime);
        recorder.stream.getTracks().forEach((t) => t.stop());
        setState("stopped");
        resolve({ blob, mimeType: actualMime, extension });
      };

      recorder.stop();
    });
  }, [cleanupSilenceDetection]);

  const clearError = useCallback(() => setError(null), []);

  return { state, error, startRecording, stopRecording, clearError };
}
