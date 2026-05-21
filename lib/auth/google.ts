const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is missing in env`);
  return value;
}

export function getGoogleAuthUrl(state: string, appUrl: string): string {
  const clientId = requiredEnv("GOOGLE_CLIENT_ID");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${appUrl}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
    state
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeGoogleCode(code: string): Promise<string> {
  const clientId = requiredEnv("GOOGLE_CLIENT_ID");
  const clientSecret = requiredEnv("GOOGLE_CLIENT_SECRET");
  const appUrl = requiredEnv("NEXT_PUBLIC_APP_URL");

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: `${appUrl}/api/auth/google/callback`,
    grant_type: "authorization_code"
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body
  });

  if (!res.ok) {
    throw new Error("Google token exchange failed");
  }

  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("Google access token missing");
  return json.access_token;
}

export async function exchangeGoogleCodeForOrigin(code: string, origin: string): Promise<string> {
  const clientId = requiredEnv("GOOGLE_CLIENT_ID");
  const clientSecret = requiredEnv("GOOGLE_CLIENT_SECRET");
  const appUrl = requiredEnv("NEXT_PUBLIC_APP_URL");
  const allowedOrigin = new URL(appUrl).origin;

  let validatedOrigin: string;
  try {
    validatedOrigin = new URL(origin).origin;
  } catch {
    throw new Error("Invalid origin URL");
  }

  if (validatedOrigin !== allowedOrigin) {
    throw new Error("Origin mismatch");
  }

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: `${validatedOrigin}/api/auth/google/callback`,
    grant_type: "authorization_code"
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body
  });

  if (!res.ok) {
    throw new Error("Google token exchange failed");
  }

  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("Google access token missing");
  return json.access_token;
}

export async function fetchGoogleProfile(accessToken: string): Promise<{ id: string; email: string; name: string }> {
  const res = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store"
  });

  if (!res.ok) {
    throw new Error("Failed to fetch Google profile");
  }

  const json = (await res.json()) as { id?: string; email?: string; name?: string };
  if (!json.id || !json.email) throw new Error("Google profile data missing");

  return {
    id: json.id,
    email: json.email,
    name: json.name || "Google User"
  };
}
