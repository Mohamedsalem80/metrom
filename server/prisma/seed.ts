import { PrismaClient } from '@prisma/client';
import { fareBands, metroLines } from '../../src/data/metroData.js';

const prisma = new PrismaClient();

async function seedMetroConfig() {
  await prisma.metroStation.deleteMany();
  await prisma.metroLine.deleteMany();
  await prisma.fareBand.deleteMany();

  for (const line of metroLines) {
    await prisma.metroLine.create({
      data: {
        id: line.id,
        label: line.label,
        routeLabel: line.routeLabel,
        stations: {
          create: line.stations.map((stationName, index) => ({
            name: stationName,
            sortOrder: index
          }))
        }
      }
    });
  }

  const normalizedFareBands = fareBands.map((band, index) => {
    if (index === 0) {
      return { ...band, minStations: 0, maxStations: 9 };
    }
    if (index === 1) {
      return { ...band, minStations: 10, maxStations: 16 };
    }
    if (index === 2) {
      return { ...band, minStations: 17, maxStations: 23 };
    }
    return { ...band, minStations: 24, maxStations: 39 };
  });

  await prisma.fareBand.createMany({
    data: normalizedFareBands.map((band) => ({
      distance: band.distance,
      minStations: band.minStations,
      maxStations: band.maxStations,
      ticket: band.ticket,
      elderly: band.elderly,
      specialNeeds: band.specialNeeds
    }))
  });
}

async function main() {
  await seedMetroConfig();
  console.log('Metro config seeded successfully.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
