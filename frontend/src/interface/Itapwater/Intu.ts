export interface NTUcenterInterface {
    ID?: number;
    Date?: string
    Data?:number;
    Note?:string;
    BeforeAfterTreatmentID?:number ;
    StandardID?:number;
    UnitID?:number;
    EmployeeID?:number;
    CustomUnit?:string;
}

export interface listNTUInterface {
  ID: number;
  Date: string;
  Data: number;
  Note: string;
  BeforeAfterTreatmentID: number;
  EnvironmentID: number;
  ParameterID: number;
  StandardID: number;
  UnitID: number;
  EmployeeID: number;
  MinValue: number;
  MiddleValue: number;
  MaxValue: number;
  UnitName: string;
  TreatmentName: string;
}

export interface DeleteNTUInterface {
  ID: number;
}