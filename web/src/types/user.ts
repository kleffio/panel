import type { ISODateString, UUID } from "./common";

export type ThemePreference = "light" | "dark" | "system";

// Application-level profile stored in our database — holds avatar, bio, and preferences.
// The `id` field equals the OIDC `sub` claim.
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
