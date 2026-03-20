import type { ISODateString, UUID } from "./common";

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
