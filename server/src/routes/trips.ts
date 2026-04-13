import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

const tripSchema = z.object({
  startLine: z.string().min(1),
  endLine: z.string().min(1),
  startStation: z.string().min(1),
  endStation: z.string().min(1),
  stationsCount: z.number().int().nonnegative(),
  estimatedTime: z.string().min(1),
  fares: z.record(z.any()),
  route: z.array(z.string()),
  transferGuide: z.string().optional(),
  transferStation: z.string().nullable().optional(),
  status: z.enum(['planned', 'traveled']).optional()
});

function parseJsonString(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function serializeTrip(trip: {
  fares: string;
  route: string;
  [key: string]: unknown;
}) {
  return {
    ...trip,
    fares: parseJsonString(trip.fares),
    route: parseJsonString(trip.route)
  };
}

router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const trips = await prisma.trip.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' }
  });

  res.json(trips.map(serializeTrip));
}));

router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const parsed = tripSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid trip payload.', errors: parsed.error.flatten() });
    return;
  }

  const trip = await prisma.trip.create({
    data: {
      userId: req.user!.id,
      startLine: parsed.data.startLine,
      endLine: parsed.data.endLine,
      startStation: parsed.data.startStation,
      endStation: parsed.data.endStation,
      stationsCount: parsed.data.stationsCount,
      estimatedTime: parsed.data.estimatedTime,
      fares: JSON.stringify(parsed.data.fares),
      route: JSON.stringify(parsed.data.route),
      transferStation: parsed.data.transferStation ?? null,
      transferGuide: parsed.data.transferGuide ?? null,
      status: parsed.data.status ?? 'planned'
    }
  });

  res.status(201).json(serializeTrip(trip));
}));

router.get('/:id', requireAuth, asyncHandler(async (req, res) => {
  const tripId = String(req.params.id);
  const trip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      userId: req.user!.id
    }
  });

  if (!trip) {
    res.status(404).json({ message: 'Trip not found.' });
    return;
  }

  res.json(serializeTrip(trip));
}));

router.patch('/:id', requireAuth, asyncHandler(async (req, res) => {
  const tripId = String(req.params.id);
  const parsed = tripSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid trip payload.', errors: parsed.error.flatten() });
    return;
  }

  const existing = await prisma.trip.findFirst({
    where: { id: tripId, userId: req.user!.id }
  });

  if (!existing) {
    res.status(404).json({ message: 'Trip not found.' });
    return;
  }

  const updateData: {
    startLine?: string;
    endLine?: string;
    startStation?: string;
    endStation?: string;
    stationsCount?: number;
    estimatedTime?: string;
    fares?: string;
    route?: string;
    transferGuide?: string | null;
    transferStation?: string | null;
    status?: 'planned' | 'traveled';
  } = {};

  if (parsed.data.startLine !== undefined) updateData.startLine = parsed.data.startLine;
  if (parsed.data.endLine !== undefined) updateData.endLine = parsed.data.endLine;
  if (parsed.data.startStation !== undefined) updateData.startStation = parsed.data.startStation;
  if (parsed.data.endStation !== undefined) updateData.endStation = parsed.data.endStation;
  if (parsed.data.stationsCount !== undefined) updateData.stationsCount = parsed.data.stationsCount;
  if (parsed.data.estimatedTime !== undefined) updateData.estimatedTime = parsed.data.estimatedTime;
  if (parsed.data.fares !== undefined) updateData.fares = JSON.stringify(parsed.data.fares);
  if (parsed.data.route !== undefined) updateData.route = JSON.stringify(parsed.data.route);
  if (parsed.data.transferGuide !== undefined) updateData.transferGuide = parsed.data.transferGuide;
  if (parsed.data.transferStation !== undefined) updateData.transferStation = parsed.data.transferStation;
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;

  const trip = await prisma.trip.update({
    where: { id: existing.id },
    data: updateData
  });

  res.json(serializeTrip(trip));
}));

router.delete('/:id', requireAuth, asyncHandler(async (req, res) => {
  const tripId = String(req.params.id);
  const existing = await prisma.trip.findFirst({
    where: { id: tripId, userId: req.user!.id }
  });

  if (!existing) {
    res.status(404).json({ message: 'Trip not found.' });
    return;
  }

  await prisma.trip.delete({ where: { id: existing.id } });
  res.status(204).send();
}));

export default router;
