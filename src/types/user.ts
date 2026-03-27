import type { ISODateString, UUID } from "./common";

export type ThemePreference = "light" | "dark" | "system";

// UserProfile is the application-level profile stored in our database.
// Separate from the OIDC/Kratos identity — it holds avatar, bio, and preferences.
// The `id` field equals the Kratos identity.id / OIDC `sub` claim.
export interface UserProfile {
  id: UUID;
  username?: string;
  avatar_url?: string;
  bio?: string;
  theme_preference: ThemePreference;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface UpdateProfilePayload {
  bio?: string;
  theme_preference?: ThemePreference;
}

