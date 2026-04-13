import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { createAccessToken, createRefreshToken, verifyRefreshToken } from '../utils/tokens.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

const signUpSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().email(),
  password: z.string().min(6)
});

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1)
});

async function issueTokens(user: { id: string; email: string }) {
  const accessToken = createAccessToken(user);
  const refresh = createRefreshToken({ id: user.id });

  await prisma.refreshToken.create({
    data: {
      id: refresh.tokenId,
      userId: user.id,
      expiresAt: refresh.expiresAt
    }
  });

  return {
    accessToken,
    refreshToken: refresh.token
  };
}

router.post('/signup', asyncHandler(async (req, res) => {
  const parsed = signUpSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid sign-up payload.', errors: parsed.error.flatten() });
    return;
  }

  const { name, email, password } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    res.status(409).json({ message: 'An account with this email already exists.' });
    return;
  }

  const passwordHash = await hashPassword(password);
  const userCount = await prisma.user.count();
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: userCount === 0 ? 'ADMIN' : 'USER'
    }
  });

  const tokens = await issueTokens({ id: user.id, email: user.email });

  res.status(201).json({
    message: 'Account created successfully.',
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    ...tokens
  });
}));

router.post('/signin', asyncHandler(async (req, res) => {
  const parsed = signInSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid sign-in payload.', errors: parsed.error.flatten() });
    return;
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    res.status(401).json({ message: 'Invalid email or password.' });
    return;
  }

  const isValidPassword = await verifyPassword(password, user.passwordHash);
  if (!isValidPassword) {
    res.status(401).json({ message: 'Invalid email or password.' });
    return;
  }

  const tokens = await issueTokens({ id: user.id, email: user.email });

  res.json({
    message: 'Signed in successfully.',
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    ...tokens
  });
}));

router.post('/refresh', asyncHandler(async (req, res) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Refresh token is required.' });
    return;
  }

  try {
    const payload = verifyRefreshToken(parsed.data.refreshToken);
    const tokenRow = await prisma.refreshToken.findUnique({ where: { id: payload.tokenId } });

    if (!tokenRow || tokenRow.revoked || tokenRow.expiresAt < new Date()) {
      res.status(401).json({ message: 'Refresh token is invalid or expired.' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      res.status(401).json({ message: 'User no longer exists.' });
      return;
    }

    await prisma.refreshToken.update({ where: { id: tokenRow.id }, data: { revoked: true } });
    const tokens = await issueTokens({ id: user.id, email: user.email });

    res.json({ message: 'Token refreshed.', ...tokens });
  } catch {
    res.status(401).json({ message: 'Refresh token is invalid or expired.' });
  }
}));

router.post('/signout', asyncHandler(async (req, res) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(200).json({ message: 'Signed out.' });
    return;
  }

  try {
    const payload = verifyRefreshToken(parsed.data.refreshToken);
    await prisma.refreshToken.updateMany({
      where: { id: payload.tokenId },
      data: { revoked: true }
    });
  } catch {
    // Ignore invalid token on signout.
  }

  res.json({ message: 'Signed out.' });
}));

export default router;
