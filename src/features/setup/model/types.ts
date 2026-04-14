export type ConfigField = {
  key: string;
  label: string;
  description?: string;
  type: string;
  required: boolean;
  default?: string;
  options?: string[];
  advanced?: boolean;
};

export type CatalogPlugin = {
  id: string;
  name: string;
  type: string;
  description: string;
  author: string;
  version: string;
  verified: boolean;
  config: ConfigField[];
  dependencies?: string[];
};

// "pick"     — top-level choice (connect existing vs bundled)
// "existing" — OIDC form for their own IDP
// "bundled"  — config form for a selected bundled plugin
export type Step = "pick" | "existing" | "bundled";

// Fallback config fields for the "connect existing IDP" path,
// used when the idp-oidc plugin isn't (yet) returned by the catalog.
export const OIDC_FALLBACK_FIELDS: ConfigField[] = [
  {
    key: "OIDC_ISSUER",
    label: "Issuer URL",
    type: "url",
    required: true,
    description:
      "Your identity provider's OIDC issuer URL (e.g. https://auth.example.com/application/o/kleff/).",
  },
  {
    key: "OIDC_CLIENT_ID",
    label: "Client ID",
    type: "string",
    required: true,
    description: "The client ID of your OIDC application.",
  },
  {
    key: "OIDC_CLIENT_SECRET",
    label: "Client Secret",
    type: "secret",
    required: false,
    advanced: true,
    description: "The client secret. Leave blank for public clients.",
  },
  {
    key: "AUTH_MODE",
    label: "Login Mode",
    type: "select",
    required: false,
    default: "headless",
    advanced: true,
    options: ["headless", "redirect"],
    description:
      "headless — Kleff shows its own login form (requires ROPC/Direct Access Grant). redirect — users are sent to your IDP's login page.",
  },
];
