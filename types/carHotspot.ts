export interface CarHotspot {
  id: string;
  areaId: string;
  viewId: string;
  label: string;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  linkedAreaId: string;
}
