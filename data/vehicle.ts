import { Vehicle } from '../types';

export const vehicle: Vehicle = {
  id: 'prisma-2009-2010',
  brand: 'Chevrolet',
  model: 'Prisma',
  year: 2009,
  modelYear: 2010,
  engine: 'Motor GM 1.0L 8V Flexpower',
  engineDisplacement: '999cm³',
  fuelType: 'Gasolina/Etanol',
  transmission: 'Manual 5 Marchas',
  version: 'Maxx',
  vin: '9BGXXX00A00000000',
  plate: 'XXX-0000',
  mileage: 0,
  color: 'Preto'
};

// As especificações técnicas do veículo (óleo, velas, fluidos, capacidades)
// vivem agora em Specification/FluidSpecification/MaintenanceInterval (banco),
// cada uma com sua fonte rastreável - ver data/specifications.ts,
// data/fluid-specifications.ts e data/maintenance-intervals.ts. O antigo
// `vehicleSpecs` estático era código morto (sem nenhuma referência no app)
// e continha valores não confirmados/divergentes da fonte oficial, por isso
// foi removido em vez de mantido lado a lado com os dados corretos.
