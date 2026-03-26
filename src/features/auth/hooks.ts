import { useMemo } from "react"; //TODO: remove this import when auth is ready

import { useAuth as useOidcAuth } from "react-oidc-context";

//TODO: remove ALL code from below this line when auth is ready
import { authDisabled } from "./config";

export function useAuth() {
  const auth = useOidcAuth();

  return useMemo(() => {
    if (!authDisabled) {
      return auth;
    }

    const disabledAuth = {
      ...auth,
      isAuthenticated: true,
      isLoading: false,
      error: undefined,
      user: {
        profile: {
          name: "Dev User",
          email: "dev@local.test",
        },
        access_token: "",
      },
      signinRedirect: async () => undefined,
      signinResourceOwnerCredentials: async () => undefined,
      signoutRedirect: async () => undefined,
    };

    return disabledAuth;
  }, [auth]);
}
