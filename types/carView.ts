import { ViewType } from './enums';

export interface CarView {
  id: string;
  vehicleId: string;
  name: string;
  viewType: ViewType;
  description: string;
  cameraPosition: {
    x: number;
    y: number;
    z: number;
  };
  cameraTarget: {
    x: number;
    y: number;
    z: number;
  };
  thumbnailUrl: string;
}
