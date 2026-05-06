let accessToken: string | null = null;

export function setApiAccessToken(token: string | null): void {
  accessToken = token;
}

export function clearApiAccessToken(): void {
  accessToken = null;
}

export function getApiAccessToken(): string | null {
  return accessToken;
}
