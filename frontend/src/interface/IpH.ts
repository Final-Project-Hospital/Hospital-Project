export interface CreatePHInterface {
  Date: Date | string;
  Data: number;
  BeforeAfterTreatmentID: number;
  StandardID: number;
  UnitID: number;
  EmployeeID: number;
  Note?: string;
}

export interface UpdatePHInterface {
  ID: number; // ต้องระบุ ID เพื่อบอกว่าจะอัปเดตรายการไหน
  Date: Date | string;
  Data: number;
  BeforeAfterTreatmentID: number;
  ParameterID: number; // ค่า Parameter ต้องถูกระบุในการอัปเดต
  StandardID: number;
  UnitID: number;
  EmployeeID: number;
  Note?: string;
}

export interface DeletePHInterface {
  ID: number;
}
