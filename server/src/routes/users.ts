import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { createAccessToken, createRefreshToken } from '../utils/tokens.js';

const router = Router();

const updateUserSchema = z.object({
  name: z.string().trim().min(2).optional(),
  email: z.string().email().optional(),
  currentPassword: z.string().min(1).optional(),
  newPassword: z.string().min(6).optional()
}).refine((data) => data.name !== undefined || data.email !== undefined || data.newPassword !== undefined, {
  message: 'At least one field must be updated.'
});

async function issueReplacementTokens(user: { id: string; email: string }) {
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

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, createdAt: true }
  });

  if (!user) {
    res.status(404).json({ message: 'User not found.' });
    return;
  }

  res.json(user);
}));

router.post('/bootstrap-admin', requireAuth, asyncHandler(async (req, res) => {
  const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
  if (adminCount > 0) {
    res.status(409).json({ message: 'An admin account already exists.' });
    return;
  }

  const updated = await prisma.user.update({
    where: { id: req.user!.id },
    data: { role: 'ADMIN' },
    select: { id: true, name: true, email: true, role: true, createdAt: true }
  });

  res.json({ message: 'Admin account bootstrapped successfully.', user: updated });
}));

router.patch('/me', requireAuth, asyncHandler(async (req, res) => {
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid account update payload.', errors: parsed.error.flatten() });
    return;
  }

  const userId = req.user!.id;
  const currentUser = await prisma.user.findUnique({ where: { id: userId } });

  if (!currentUser) {
    res.status(404).json({ message: 'User not found.' });
    return;
  }

  if (parsed.data.newPassword) {
    if (!parsed.data.currentPassword) {
      res.status(400).json({ message: 'Current password is required to change your password.' });
      return;
    }

    const validPassword = await verifyPassword(parsed.data.currentPassword, currentUser.passwordHash);
    if (!validPassword) {
      res.status(401).json({ message: 'Current password is incorrect.' });
      return;
    }
  }

  if (parsed.data.email && parsed.data.email !== currentUser.email) {
    const emailTaken = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (emailTaken) {
      res.status(409).json({ message: 'An account with this email already exists.' });
      return;
    }
  }

  const data: { name?: string; email?: string; passwordHash?: string } = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.email !== undefined) data.email = parsed.data.email;
  if (parsed.data.newPassword !== undefined) data.passwordHash = await hashPassword(parsed.data.newPassword);

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, name: true, email: true, role: true, createdAt: true }
  });

  await prisma.refreshToken.updateMany({
    where: { userId },
    data: { revoked: true }
  });

  const tokens = await issueReplacementTokens({ id: updatedUser.id, email: updatedUser.email });

  res.json({
    message: 'Account updated successfully.',
    user: updatedUser,
    ...tokens
  });
}));

router.delete('/me', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.user!.id;

  const existingUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!existingUser) {
    res.status(404).json({ message: 'User not found.' });
    return;
  }

  await prisma.user.delete({ where: { id: userId } });
  res.status(204).send();
}));

export default router;
