export const ROLES = { COACH: "coach", CLIENT: "client" };

// Add coach usernames here. In production, replace with
// a server-side role check (e.g. JWT claims or DB lookup).
export const COACH_USERNAMES = new Set(["jcartier", "admin"]);

export function getRole(username) {
  return COACH_USERNAMES.has(username?.toLowerCase())
    ? ROLES.COACH
    : ROLES.CLIENT;
}
