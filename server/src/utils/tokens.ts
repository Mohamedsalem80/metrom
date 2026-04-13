import jwt, { type JwtPayload } from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { env } from '../env.js';

export type AccessTokenPayload = JwtPayload & {
  sub: string;
  email: string;
};

export type RefreshTokenPayload = JwtPayload & {
  sub: string;
  tokenId: string;
  type: 'refresh';
};

export function createAccessToken(user: { id: string; email: string }): string {
  return jwt.sign(
    { sub: user.id, email: user.email },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES as jwt.SignOptions['expiresIn'] }
  );
}

export function createRefreshToken(user: { id: string }): { token: string; tokenId: string; expiresAt: Date } {
  const tokenId = randomUUID();
  const expiresAt = new Date(Date.now() + env.JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

  const token = jwt.sign(
    { sub: user.id, tokenId, type: 'refresh' },
    env.JWT_REFRESH_SECRET,
    { expiresIn: `${env.JWT_REFRESH_EXPIRES_DAYS}d` }
  );

  return { token, tokenId, expiresAt };
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}
