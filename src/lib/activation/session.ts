"use client";

import type { ActivationContextSummary } from "./types";

const ACTIVATION_SESSION_KEY = "keon.activation.session";
const ACTIVATION_SESSION_EVENT = "keon:activation-session-changed";

function isBrowser() {
  return typeof window !== "undefined";
}

function emitActivationSessionChanged() {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(new CustomEvent(ACTIVATION_SESSION_EVENT));
}

export function getStoredActivationSession(): ActivationContextSummary | null {
  if (!isBrowser()) {
    return null;
  }

  const raw = window.localStorage.getItem(ACTIVATION_SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as ActivationContextSummary;
  } catch {
    window.localStorage.removeItem(ACTIVATION_SESSION_KEY);
    return null;
  }
}

export function setStoredActivationSession(session: ActivationContextSummary) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(ACTIVATION_SESSION_KEY, JSON.stringify(session));
  emitActivationSessionChanged();
}

export function clearStoredActivationSession() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(ACTIVATION_SESSION_KEY);
  emitActivationSessionChanged();
}

export function subscribeToActivationSession(listener: () => void) {
  if (!isBrowser()) {
    return () => undefined;
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key === ACTIVATION_SESSION_KEY) {
      listener();
    }
  };

  window.addEventListener(ACTIVATION_SESSION_EVENT, listener);
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener(ACTIVATION_SESSION_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
}
