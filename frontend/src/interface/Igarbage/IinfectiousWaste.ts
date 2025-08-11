export interface InfectiouscenterInterface {
  Date?: string;
  Quantity?: number;
  AADC?: number;
  MonthlyGarbage?: number;
  AverageDailyGarbage?: number;
  TotalSale?: number | null;
  Note?: string | null;
  TargetID?: number;
  UnitID?: number;
  CustomUnit?: string | null;
  EmployeeID?: number;  
}

export interface listInfectiousInterface {
    ID: number;
    Date: string;
    Quantity: number;
    AADC: number;
    MonthlyGarbage: number;
    TotalSale: number;
    Note: string;
    EnvironmentID: number;
    ParameterID: number;
    TargetID: number;
    UnitID: number;
    EmployeeID: number;
    MinTarget: number;
    MiddleTarget: number;
    MaxTarget: number;
    UnitName: string;
}

export interface DeleteInfectiousInterface {
    ID: number;
}