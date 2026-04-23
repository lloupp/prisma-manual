export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  modelYear: number;
  engine: string;
  engineDisplacement: string;
  fuelType: string;
  transmission: string;
  version: string;
  vin: string;
  plate: string;
  mileage: number;
  color: string;
}

export interface VehicleSpecs {
  oilType: string;
  oilViscosity: string;
  oilCapacity: string;
  oilFilterThread: string;
  sparkPlugModel: string;
  sparkPlugQuantity: number;
  batteryAh: number;
  batteryVoltage: number;
  coolantType: string;
  coolantCapacity: string;
  brakeFluidType: string;
  brakePadFront: string;
  brakePadRear: string;
  wiperBladeSize: string;
  airFilterType: string;
  fuelFilterType: string;
}
