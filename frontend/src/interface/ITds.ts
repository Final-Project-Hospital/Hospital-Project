export interface CreateTDSInterface {
  Date: Date | string;
  Data: number;
  BeforeAfterTreatmentID: number;
  EnvironmentID: number;
  StandardID: number;
  UnitID: number;
  EmployeeID: number;
  Note?: string;
}

export interface UpdateTDSInterface {
  ID: number; // ต้องระบุ ID เพื่อบอกว่าจะอัปเดตรายการไหน
  Date: Date | string;
  Data: number;
  BeforeAfterTreatmentID: number;
  EnvironmentID: number;
  ParameterID: number; // ค่า Parameter ต้องถูกระบุในการอัปเดต
  StandardID: number;
  UnitID: number;
  EmployeeID: number;
  Note?: string;
}

export interface DeleteTDSInterface {
  ID: number;
}
