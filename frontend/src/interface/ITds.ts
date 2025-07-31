export interface CreateTDSInterface {
  Date: Date | string;
  Data: number;
  BeforeAfterTreatmentID: number;
  StandardID: number;
  UnitID: number;
  EmployeeID: number;
  Note?: string;
  CustomUnit?: string;
}

export interface UpdateTDSInterface {
  ID: number;
  Date: string; 
  Data: number;
  BeforeAfterTreatmentID: number;
  ParameterID: number;
  StandardID: number;
  UnitID: number | null;
  EmployeeID: number;
  Note?: string;
  CustomUnit?: string;
}

export interface DeleteTDSInterface {
  ID: number;
}
