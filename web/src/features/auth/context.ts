import { createContext } from "react";
import type { CurrentUser } from "./models";
import type { AuthConfig } from "./api";

export { type CurrentUser };

export const CurrentUserContext = createContext<CurrentUser | null>(null);

/**
 * Provides the resolved auth config from GET /api/v1/auth/config.
 * null while the initial fetch is in-flight.
 */
export const AuthConfigContext = createContext<AuthConfig | null>(null);
