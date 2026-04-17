import { PassedInitialConfig } from 'angular-auth-oidc-client';
import { environment } from '../../environments/environment';

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:4200'; // fallback for SSR
};

export const authConfig: PassedInitialConfig = {
  config: {
    authority: 'https://euc1.auth.ac/auth/realms/shop-netic',
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