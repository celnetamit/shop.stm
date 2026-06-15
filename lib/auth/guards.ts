import { prisma } from "@/lib/prisma";
import { getCurrentSession, type SessionPayload } from "@/lib/auth/session";

/**
 * Require an authenticated session. Returns it, or null.
 */
export async function requireSession(): Promise<SessionPayload | null> {
  return getCurrentSession();
}

/**
 * Require ADMIN authority, RE-DERIVED FROM THE DATABASE on every request rather than
 * trusting the role baked into the (long-lived) JWT. A demoted or deleted admin loses
 * access immediately on their next request, closing the stale-token-role window.
 *
 * Returns the session when authorized, else null. (Admin routes are low-traffic, so the
 * extra per-request lookup is negligible.)
 *
 * NOTE (future enhancement): a `User.tokenVersion` column embedded in the JWT would also
 * allow revoking a single leaked/stolen session without changing the user's role.
 */
export async function requireAdmin(): Promise<SessionPayload | null> {
  const session = await getCurrentSession();
  if (!session) return null;

  const user = await prisma.user
    .findUnique({ where: { id: session.sub }, select: { role: true } })
    .catch(() => null);

  if (!user || user.role !== "ADMIN") return null;
  return session;
}
