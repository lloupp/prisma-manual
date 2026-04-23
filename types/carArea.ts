import { AreaType } from './enums';

export interface CarArea {
  id: string;
  vehicleId: string;
  name: string;
  areaType: AreaType;
  description: string;
  iconName: string;
  systemIds: string[];
}
