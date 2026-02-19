import { useState, useEffect, createContext, useContext } from "react";

type AppMode = "focus" | "play";

interface AppModeContext {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  toggle: () => void;
  isPlayMode: boolean;
}

const AppModeCtx = createContext<AppModeContext>({
  mode: "focus",
  setMode: () => {},
  toggle: () => {},
  isPlayMode: false,
});

export function useAppMode() {
  return useContext(AppModeCtx);
}

export function useAppModeProvider() {
  const [mode, setMode] = useState<AppMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("void-app-mode") as AppMode) || "focus";
    }
    return "focus";
  });

  useEffect(() => {
    localStorage.setItem("void-app-mode", mode);
  }, [mode]);

  const toggle = () => setMode((prev) => (prev === "focus" ? "play" : "focus"));

  return {
    mode,
    setMode,
    toggle,
    isPlayMode: mode === "play",
    Provider: AppModeCtx.Provider,
  };
}
