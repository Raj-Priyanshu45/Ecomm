import { PassedInitialConfig } from 'angular-auth-oidc-client';

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:4200'; // fallback for SSR
};

export const authConfig: PassedInitialConfig = {
  config: {
    authority: 'http://localhost:8181/realms/ecomApp',
    redirectUrl: getBaseUrl(),
    postLogoutRedirectUri: getBaseUrl(),
    clientId: 'angular-client',
    scope: 'openid profile offline_access',
    responseType: 'code',
    silentRenew: true,
    useRefreshToken: true,
    renewTimeBeforeTokenExpiresInSeconds: 30,
  },
};