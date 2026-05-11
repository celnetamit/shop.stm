function loadAdminEmails(): Set<string> {
  const configured = (process.env.ADMIN_EMAILS || "").replace(/^"|"$/g, "");
  const fromEnv = configured
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  // Safe fallback for local/dev when env is not set.
  const fallback = ["manish@celnet.in", "vivek.verma@panoptical.org"];
  return new Set(fromEnv.length ? fromEnv : fallback);
}

export function isAdminEmail(email: string): boolean {
  return loadAdminEmails().has(email.trim().toLowerCase());
}

export function roleForEmail(email: string): "ADMIN" | "USER" {
  return isAdminEmail(email) ? "ADMIN" : "USER";
}
