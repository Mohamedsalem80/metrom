import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

const lineSchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(2),
  routeLabel: z.string().trim().min(2)
});

const updateLineSchema = lineSchema.partial().refine(
  (data) => data.id !== undefined || data.label !== undefined || data.routeLabel !== undefined,
  { message: 'At least one line field is required.' }
);
const fareBandBaseSchema = z.object({
  distance: z.string().trim().min(1),
  minStations: z.number().int().nonnegative(),
  maxStations: z.number().int().positive(),
  ticket: z.string().trim().min(1),
  elderly: z.string().trim().min(1),
  specialNeeds: z.string().trim().min(1)
});

const stationSchema = z.object({
  lineId: z.string().trim().min(1),
  name: z.string().trim().min(1),
  sortOrder: z.number().int().nonnegative()
});

const updateStationSchema = stationSchema.partial().refine(
  (data) => data.lineId !== undefined || data.name !== undefined || data.sortOrder !== undefined,
  { message: 'At least one station field is required.' }
);

const fareBandSchema = z.object({
  distance: z.string().trim().min(1),
  minStations: z.number().int().nonnegative(),
  maxStations: z.number().int().positive(),
  ticket: z.string().trim().min(1),
  elderly: z.string().trim().min(1),
  specialNeeds: z.string().trim().min(1)
}).refine((data) => data.maxStations >= data.minStations, {
  message: 'maxStations must be greater than or equal to minStations.'
});

const updateFareBandSchema = fareBandBaseSchema.partial().refine(
  (data) =>
    data.distance !== undefined ||
    data.minStations !== undefined ||
    data.maxStations !== undefined ||
    data.ticket !== undefined ||
    data.elderly !== undefined ||
    data.specialNeeds !== undefined,
  { message: 'At least one fare band field is required.' }
);

async function buildMetroConfig() {
  const [lines, fareBands] = await Promise.all([
    prisma.metroLine.findMany({
      orderBy: { id: 'asc' },
      include: {
        stations: {
          orderBy: { sortOrder: 'asc' },
          select: { id: true, name: true, sortOrder: true }
        }
      }
    }),
    prisma.fareBand.findMany({ orderBy: { minStations: 'asc' } })
  ]);

  return {
    lines: lines.map((line) => ({
      id: line.id,
      label: line.label,
      routeLabel: line.routeLabel,
      stations: line.stations.map((station) => station.name),
      stationRecords: line.stations
    })),
    fareBands
  };
}

router.get('/config', asyncHandler(async (_req, res) => {
  const config = await buildMetroConfig();
  res.json(config);
}));

router.get('/admin/config', requireAuth, requireAdmin, asyncHandler(async (_req, res) => {
  const config = await buildMetroConfig();
  res.json(config);
}));

router.post('/admin/lines', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const parsed = lineSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid line payload.', errors: parsed.error.flatten() });
    return;
  }

  const created = await prisma.metroLine.create({ data: parsed.data });
  res.status(201).json(created);
}));

router.patch('/admin/lines/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const parsed = updateLineSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid line payload.', errors: parsed.error.flatten() });
    return;
  }

  const lineId = String(req.params.id);
  const updated = await prisma.metroLine.update({
    where: { id: lineId },
    data: parsed.data
  });

  res.json(updated);
}));

router.delete('/admin/lines/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const lineId = String(req.params.id);
  await prisma.metroLine.delete({ where: { id: lineId } });
  res.status(204).send();
}));

router.post('/admin/stations', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const parsed = stationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid station payload.', errors: parsed.error.flatten() });
    return;
  }

  const created = await prisma.metroStation.create({ data: parsed.data });
  res.status(201).json(created);
}));

router.patch('/admin/stations/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const parsed = updateStationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid station payload.', errors: parsed.error.flatten() });
    return;
  }

  const stationId = String(req.params.id);
  const updated = await prisma.metroStation.update({
    where: { id: stationId },
    data: parsed.data
  });

  res.json(updated);
}));

router.delete('/admin/stations/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const stationId = String(req.params.id);
  await prisma.metroStation.delete({ where: { id: stationId } });
  res.status(204).send();
}));

router.post('/admin/fares', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const parsed = fareBandSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid fare band payload.', errors: parsed.error.flatten() });
    return;
  }

  const created = await prisma.fareBand.create({ data: parsed.data });
  res.status(201).json(created);
}));

router.patch('/admin/fares/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const parsed = updateFareBandSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid fare band payload.', errors: parsed.error.flatten() });
    return;
  }

  const fareId = String(req.params.id);
  const current = await prisma.fareBand.findUnique({ where: { id: fareId } });
  if (!current) {
    res.status(404).json({ message: 'Fare band not found.' });
    return;
  }

  const merged = {
    minStations: parsed.data.minStations ?? current.minStations,
    maxStations: parsed.data.maxStations ?? current.maxStations
  };

  if (merged.maxStations < merged.minStations) {
    res.status(400).json({ message: 'maxStations must be greater than or equal to minStations.' });
    return;
  }

  const updated = await prisma.fareBand.update({
    where: { id: fareId },
    data: parsed.data
  });

  res.json(updated);
}));

router.delete('/admin/fares/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const fareId = String(req.params.id);
  await prisma.fareBand.delete({ where: { id: fareId } });
  res.status(204).send();
}));

export default router;
