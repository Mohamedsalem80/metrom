import type { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
      tokenPayload?: JwtPayload & {
        sub: string;
        email: string;
      };
    }
  }
}

export {};
