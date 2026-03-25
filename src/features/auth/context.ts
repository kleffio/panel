import { createContext } from "react";
import type { CurrentUser } from "./models";

export { type CurrentUser };

/**
 * Provides the authenticated user's ID and roles, resolved via
 * GET /api/v1/identity/me after the OIDC session is established.
 * null while loading or unauthenticated.
 */
export const CurrentUserContext = createContext<CurrentUser | null>(null);
