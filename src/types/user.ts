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

export type UserRole = "owner" | "admin" | "member" | "billing" | "viewer";

export interface User {
  id: UUID;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: UserRole;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Organization {
  id: UUID;
  name: string;
  slug: string;
  logoUrl?: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface OrganizationMember {
  user: User;
  organization: Organization;
  role: UserRole;
  joinedAt: ISODateString;
}

export interface AuthSession {
  user: User;
  organization: Organization;
  accessToken: string;
  expiresAt: ISODateString;
}
