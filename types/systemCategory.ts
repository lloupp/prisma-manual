import { SystemCategoryType } from './enums';

export interface SystemCategory {
  id: string;
  vehicleId: string;
  name: string;
  categoryType: SystemCategoryType;
  description: string;
  partIds: string[];
}
