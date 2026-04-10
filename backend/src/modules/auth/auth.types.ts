export type JwtKind = 'access' | 'refresh';

export type AuthTokenPair = {
  accessToken: string;
  refreshToken: string;
};

