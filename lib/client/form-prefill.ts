"use client";

export type PrefillUser = {
  name: string;
  email: string;
  role?: "USER" | "ADMIN" | "MANAGER" | "LIBRARIAN" | "AGENCY" | "STUDENT" | "SCHOLAR";
};

export async function fetchPrefillUser(): Promise<PrefillUser | null> {
  try {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      ok: boolean;
      user?: {
        name?: string | null;
        email?: string | null;
        role?: "USER" | "ADMIN" | "MANAGER" | "LIBRARIAN" | "AGENCY" | "STUDENT" | "SCHOLAR";
      };
    };
    if (!json.ok || !json.user) return null;
    return {
      name: (json.user.name || "").trim(),
      email: (json.user.email || "").trim(),
      role: json.user.role
    };
  } catch {
    return null;
  }
}

export function loadDraft<T>(key: string): Partial<T> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<T>;
  } catch {
    return {};
  }
}

export function saveDraft<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage errors
  }
}
