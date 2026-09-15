import type { AuthProviderProps } from "react-oidc-context";
import { WebStorageStateStore } from "oidc-client-ts";

const authority = import.meta.env.COGNITO_AUTHORITY;
const clientId = import.meta.env.COGNITO_CLIENT_ID;
const redirectUri = import.meta.env.COGNITO_REDIRECT_URI;
const logoutUri = import.meta.env.COGNITO_LOGOUT_URI ?? redirectUri;

if (!authority || !clientId || !redirectUri) {
  // eslint-disable-next-line no-console
  console.warn(
    "[auth] Missing Cognito env vars. Copy .env.example to .env.local and fill them in."
  );
}

/**
 * `authority` is the Cognito issuer. react-oidc-context discovers the
 * authorize/token/jwks endpoints from the .well-known config.
 */
export const oidcConfig: AuthProviderProps = {
  authority,
  client_id: clientId,
  redirect_uri: redirectUri,
  post_logout_redirect_uri: logoutUri,
  response_type: "code",
  scope: "openid email",
  automaticSilentRenew: true,
  userStore: new WebStorageStateStore({ store: window.localStorage }),
};

/**
 * Cognito logout needs a redirect_uri param pointed at the Hosted UI.
 * Derive it from the issuer: https://cognito-idp.<region>.amazonaws.com/<poolId>
 *   → https://<domain>.auth.<region>.amazoncognito.com/logout
 * If you already have the Hosted UI domain, put it in an env var instead.
 */
export function cognitoLogoutUrl(): string {
  const region = authority?.split(".")[1] ?? "us-east-1";
  const domain = import.meta.env.COGNITO_HOSTED_UI_DOMAIN ?? "";
  if (!domain) return redirectUri;
  const params = new URLSearchParams({
    client_id: clientId,
    logout_uri: logoutUri,
  });
  return `https://${domain}.auth.${region}.amazoncognito.com/logout?${params.toString()}`;
}