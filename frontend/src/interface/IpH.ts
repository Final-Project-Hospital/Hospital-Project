export interface CreatePHInterface {
  Date: Date | string;
  Data: number;
  BeforeAfterTreatmentID: number;
  StandardID: number;
  UnitID: number;
  EmployeeID: number;
  Note?: string;
  CustomUnit?: string;
}

export interface UpdatePHInterface {
  ID: number; 
  Date: Date | string;
  Data: number;
  BeforeAfterTreatmentID: number;
  ParameterID: number; 
  StandardID: number;
  UnitID: number;
  EmployeeID: number;
  Note?: string;
}

export interface DeletePHInterface {
  ID: number;
}
