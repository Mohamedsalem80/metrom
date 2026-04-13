import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../utils/tokens.js';
import { prisma } from '../db.js';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Missing or invalid Authorization header.' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email
    };
    req.tokenPayload = payload;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired access token.' });
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user?.id) {
    res.status(401).json({ message: 'Authentication required.' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { role: true }
  });

  if (!user || user.role !== 'ADMIN') {
    res.status(403).json({ message: 'Admin access required.' });
    return;
  }

  next();
}
