/** Shape of the token returned by POST /api/v1/auth/login (inside data.data). */
export interface ApiTokenResponse {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
}

/** Authenticated user info returned by GET /api/v1/identity/me. */
export interface CurrentUser {
  userId: string;
  roles: string[];
}
