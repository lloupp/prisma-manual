// prisma/seed.ts
// Script para popular o banco de dados com os dados do manual

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { vehicle } from '../data/vehicle';
import * as dataSystems from '../data/systems';
import * as dataParts from '../data/parts';
import * as dataGuides from '../data/guides';
import * as dataViews from '../data/views';
import * as dataHotspots from '../data/hotspots';

async function main() {
  console.log('🔌 Setting up database connection...');
  const adapter = new PrismaLibSql({ url: 'file:./dev.db' });
  const prisma = new PrismaClient({ adapter });
  console.log('🌱 Starting seed...');

  // Clear existing data
  await prisma.hotspot.deleteMany();
  await prisma.carView.deleteMany();
  await prisma.guideStep.deleteMany();
  await prisma.guide.deleteMany();
  await prisma.part.deleteMany();
  await prisma.system.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  // Create vehicle
  const vehicleData = {
    id: vehicle.id,
    name: `${vehicle.brand} ${vehicle.model} ${vehicle.version}`,
    year: vehicle.year,
    model: vehicle.model,
    engine: vehicle.engine,
    fuelType: vehicle.fuelType,
  };
  const createdVehicle = await prisma.vehicle.create({ data: vehicleData });
  console.log('✅ Vehicle created:', createdVehicle.name);

  // Create systems with their parts
  for (const system of dataSystems.systems) {
    const { partIds, ...systemData } = system;
    const createdSystem = await prisma.system.create({
      data: {
        ...systemData,
        vehicleId: createdVehicle.id,
      },
    });

    // Create parts for this system
    const systemParts = dataParts.parts.filter(p => system.partIds.includes(p.id));
    for (const part of systemParts) {
      const { id, symptoms, guideIds, ...partData } = part;
      const createdPart = await prisma.part.create({
        data: {
          id,
          ...partData,
          systemId: createdSystem.id,
        },
      });

      // Create guides for this part
      const partGuides = dataGuides.guides.filter(g => g.partId === part.id);
      for (const guide of partGuides) {
        const { steps, tools, materials, ...guideData } = guide;
        const createdGuide = await prisma.guide.create({
          data: {
            ...guideData,
            partId: createdPart.id,
            precautions: JSON.stringify(guide.precautions),
            commonIssues: JSON.stringify(guide.commonIssues),
          },
        });

        // Create guide steps
        for (const step of steps) {
          await prisma.guideStep.create({
            data: {
              id: `${createdGuide.id}-step-${step.stepNumber}`,
              stepNumber: step.stepNumber,
              title: step.title,
              description: step.description,
              imageUrl: step.imageUrl || null,
              guideId: createdGuide.id,
              tips: JSON.stringify(step.tips),
              warnings: JSON.stringify(step.warnings),
            },
          });
        }
      }
    }
  }
  console.log(`✅ ${dataSystems.systems.length} systems with parts and guides created`);

  // Create views
  for (const view of dataViews.views) {
    await prisma.carView.create({
      data: {
        id: view.id,
        vehicleId: createdVehicle.id,
        name: view.name,
        viewType: view.viewType,
        description: view.description,
        cameraPositionX: view.cameraPosition.x,
        cameraPositionY: view.cameraPosition.y,
        cameraPositionZ: view.cameraPosition.z,
        cameraTargetX: view.cameraTarget.x,
        cameraTargetY: view.cameraTarget.y,
        cameraTargetZ: view.cameraTarget.z,
        thumbnailUrl: view.thumbnailUrl,
      },
    });
  }
  console.log(`✅ ${dataViews.views.length} views created`);

  // Create hotspots
  for (const hotspot of dataHotspots.hotspots) {
    await prisma.hotspot.create({
      data: {
        id: `hotspot-${hotspot.area}-${hotspot.view}`,
        viewId: hotspot.view,
        area: hotspot.area,
        x: hotspot.x,
        y: hotspot.y,
      },
    });
  }
  console.log(`✅ ${dataHotspots.hotspots.length} hotspots created`);

  // Create default user
  await prisma.user.create({
    data: {
      id: 'user-1',
      email: 'admin@prisma-manual.local',
      // password: "admin123" (will be hashed in real implementation)
      password: '$2a$10$demo-hashed-password',
      name: 'Administrador',
    },
  });
  console.log('✅ Default user created');

  console.log('🎉 Seed completed!');
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  });