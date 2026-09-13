// prisma/seed.ts
// Script para popular o banco de dados com os dados do manual

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { databaseConfig } from '../lib/database-config';
import { vehicle } from '../data/vehicle';
import * as dataSystems from '../data/systems';
import * as dataParts from '../data/parts';
import * as dataGuides from '../data/guides';
import * as dataViews from '../data/views';
import * as dataHotspots from '../data/hotspots';
import * as dataSources from '../data/sources';
import * as dataSourceReferences from '../data/source-references';
import * as dataSpecifications from '../data/specifications';
import * as dataFluidSpecifications from '../data/fluid-specifications';
import * as dataMaintenanceIntervals from '../data/maintenance-intervals';
import * as dataTorqueSpecifications from '../data/torque-specifications';

function upsertData<T extends { id: string }>(data: T) {
  return { where: { id: data.id }, create: data, update: data };
}

async function main() {
  console.log('🔌 Setting up database connection...');
  const adapter = new PrismaLibSql(databaseConfig());
  const prisma = new PrismaClient({ adapter });
  console.log('🌱 Starting seed...');

  // Incremental refresh: update catalog IDs, retain extra rows and user history.
  // User and DiagnosticSession are never created, changed, or deleted here.
  try {
    // Upsert vehicle
    const vehicleData = {
      id: vehicle.id,
      name: `${vehicle.brand} ${vehicle.model} ${vehicle.version}`,
      year: vehicle.year,
      model: vehicle.model,
      engine: vehicle.engine,
      fuelType: vehicle.fuelType,
    };
    const createdVehicle = await prisma.vehicle.upsert(upsertData(vehicleData));
    console.log('✅ Vehicle synced:', createdVehicle.name);

    // Upsert systems with their parts
    for (const system of dataSystems.systems) {
      const { partIds, ...systemData } = system;
      const createdSystem = await prisma.system.upsert(upsertData({
        ...systemData,
        vehicleId: createdVehicle.id,
      }));

      // Upsert parts for this system
      const systemParts = dataParts.parts.filter(p => system.partIds.includes(p.id));
      for (const part of systemParts) {
        const { id, symptoms, guideIds, ...partData } = part;
        const createdPart = await prisma.part.upsert(upsertData({
          id,
          ...partData,
          systemId: createdSystem.id,
        }));

        // Upsert guides for this part
        const partGuides = dataGuides.guides.filter(g => g.partId === part.id);
        for (const guide of partGuides) {
          const { steps, tools, materials, ...guideData } = guide;
          const createdGuide = await prisma.guide.upsert(upsertData({
            ...guideData,
            partId: createdPart.id,
            precautions: JSON.stringify(guide.precautions),
            commonIssues: JSON.stringify(guide.commonIssues),
          }));

          // Upsert guide steps
          for (const step of steps) {
            await prisma.guideStep.upsert(upsertData({
              id: `${createdGuide.id}-step-${step.stepNumber}`,
              stepNumber: step.stepNumber,
              title: step.title,
              description: step.description,
              imageUrl: step.imageUrl || null,
              guideId: createdGuide.id,
              tips: JSON.stringify(step.tips),
              warnings: JSON.stringify(step.warnings),
            }));
          }
        }
      }
    }
    console.log(`✅ ${dataSystems.systems.length} systems with parts and guides created`);

    // Upsert views
    for (const view of dataViews.views) {
      await prisma.carView.upsert(upsertData({
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
      }));
    }
    console.log(`✅ ${dataViews.views.length} views created`);

    // Upsert hotspots
    for (const hotspot of dataHotspots.hotspots) {
      await prisma.hotspot.upsert(upsertData({
        id: `hotspot-${hotspot.area}-${hotspot.view}`,
        viewId: hotspot.view,
        area: hotspot.area,
        x: hotspot.x,
        y: hotspot.y,
      }));
    }
    console.log(`✅ ${dataHotspots.hotspots.length} hotspots synced`);

    // Upsert sources
    for (const source of dataSources.sources) {
      await prisma.source.upsert(upsertData(source));
    }
    console.log(`✅ ${dataSources.sources.length} sources synced`);

    // Upsert specifications
    for (const spec of dataSpecifications.specifications) {
      await prisma.specification.upsert(upsertData(spec));
    }
    console.log(`✅ ${dataSpecifications.specifications.length} specifications synced`);

    // Upsert fluid specifications
    for (const fluid of dataFluidSpecifications.fluidSpecifications) {
      await prisma.fluidSpecification.upsert(upsertData(fluid));
    }
    console.log(`✅ ${dataFluidSpecifications.fluidSpecifications.length} fluid specifications synced`);

    // Upsert maintenance intervals
    for (const interval of dataMaintenanceIntervals.maintenanceIntervals) {
      await prisma.maintenanceInterval.upsert(upsertData(interval));
    }
    console.log(`✅ ${dataMaintenanceIntervals.maintenanceIntervals.length} maintenance intervals synced`);

    // Upsert torque specifications (empty until a real source is found)
    for (const torque of dataTorqueSpecifications.torqueSpecifications) {
      await prisma.torqueSpecification.upsert(upsertData(torque));
    }
    console.log(`✅ ${dataTorqueSpecifications.torqueSpecifications.length} torque specifications synced`);

    // Upsert source references (must come after Source and after the
    // Part/Specification/FluidSpecification/MaintenanceInterval rows they point to)
    for (const ref of dataSourceReferences.sourceReferences) {
      await prisma.sourceReference.upsert(upsertData(ref));
    }
    console.log(`✅ ${dataSourceReferences.sourceReferences.length} source references synced`);

    console.log('🎉 Seed completed!');
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(() => {
    console.error('Seed falhou. Confira configuração, schema e dados do manual. Nenhuma exclusão é executada por este script.');
    process.exit(1);
  });