import { Vehicle, VehicleSpecs } from '../types';

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

export const vehicleSpecs: VehicleSpecs = {
  oilType: 'Semi Sintético 5W30',
  oilViscosity: '5W30',
  oilCapacity: '3,75L',
  oilFilterThread: 'M22x1.5',
  sparkPlugModel: 'NGK BPR6ES',
  sparkPlugQuantity: 4,
  batteryAh: 50,
  batteryVoltage: 12,
  coolantType: 'Adesivo para Arrefecimento OEM',
  coolantCapacity: '4,5L',
  brakeFluidType: 'DOT 4',
  brakePadFront: 'Pagid 5375-5358',
  brakePadRear: 'Pagid 5374',
  wiperBladeSize: '18 polegadas / 450mm',
  airFilterType: 'Original GM 93330597',
  fuelFilterType: 'Original GM 93321598'
};
