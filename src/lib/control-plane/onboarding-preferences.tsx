"use client";

import * as React from "react";

export type OnboardingTrack = "governed-execution" | "memory-context" | "collective-oversight";
export type OnboardingRoleHint = "organization" | "builder";

interface OnboardingPreferencesValue {
  selectedTracks: OnboardingTrack[];
  roleHint: OnboardingRoleHint | null;
  hasPreferences: boolean;
  toggleTrack: (track: OnboardingTrack) => void;
  setRoleHint: (role: OnboardingRoleHint) => void;
  clearPreferences: () => void;
}

const TRACKS_KEY = "keon.onboarding.tracks";
const ROLE_KEY = "keon.onboarding.role";

const OnboardingPreferencesContext = React.createContext<OnboardingPreferencesValue>({
  selectedTracks: [],
  roleHint: null,
  hasPreferences: false,
  toggleTrack: () => undefined,
  setRoleHint: () => undefined,
  clearPreferences: () => undefined,
});

export function OnboardingPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [selectedTracks, setSelectedTracks] = React.useState<OnboardingTrack[]>([]);
  const [roleHint, setRoleHintState] = React.useState<OnboardingRoleHint | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const tracks = window.localStorage.getItem(TRACKS_KEY);
    const role = window.localStorage.getItem(ROLE_KEY) as OnboardingRoleHint | null;

    if (tracks) {
      try {
        const parsed = JSON.parse(tracks) as OnboardingTrack[];
        if (Array.isArray(parsed)) {
          setSelectedTracks(parsed);
        }
      } catch {
        window.localStorage.removeItem(TRACKS_KEY);
      }
    }

    if (role === "organization" || role === "builder") {
      setRoleHintState(role);
    }
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (selectedTracks.length > 0) {
      window.localStorage.setItem(TRACKS_KEY, JSON.stringify(selectedTracks));
    } else {
      window.localStorage.removeItem(TRACKS_KEY);
    }
  }, [selectedTracks]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (roleHint) {
      window.localStorage.setItem(ROLE_KEY, roleHint);
    } else {
      window.localStorage.removeItem(ROLE_KEY);
    }
  }, [roleHint]);

  const toggleTrack = React.useCallback((track: OnboardingTrack) => {
    setSelectedTracks((current) =>
      current.includes(track) ? current.filter((item) => item !== track) : [...current, track]
    );
  }, []);

  const setRoleHint = React.useCallback((role: OnboardingRoleHint) => {
    setRoleHintState(role);
  }, []);

  const clearPreferences = React.useCallback(() => {
    setSelectedTracks([]);
    setRoleHintState(null);
  }, []);

  return (
    <OnboardingPreferencesContext.Provider
      value={{
        selectedTracks,
        roleHint,
        hasPreferences: selectedTracks.length > 0,
        toggleTrack,
        setRoleHint,
        clearPreferences,
      }}
    >
      {children}
    </OnboardingPreferencesContext.Provider>
  );
}

export function useOnboardingPreferences() {
  return React.useContext(OnboardingPreferencesContext);
}
