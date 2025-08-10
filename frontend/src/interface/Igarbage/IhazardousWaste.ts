// export interface HazardouscenterInterface {
//     ID?: number;
//     Date?: string;
//     Quantity?: number;
//     AADC?: number;
//     MonthlyGarbage?: number;
//     TotalSale?: number;
//     Note?: string;
//     TargetID?: number;
//     UnitID?: number;
//     EmployeeID?: number;
//     CustomUnit?: string;
// }

//อหก
// export interface HazardouscenterInterface {
//     Date: string;
//     Quantity?: number;
//     AADC?: string;
//     MonthlyGarbage?: number;
//     // AverageDailyGarbage?: number;  // ลบออก
//     TotalSale?: number;
//     Note?: string;
//     EnvironmentID?: number;
//     ParameterID?: number;
//     TargetID?: number;
//     UnitID?: number;
//     CustomUnit?: string;
//     StatusID?: number;
//     EmployeeID?: number;
// }
export interface HazardouscenterInterface {
  Date?: string;                 // เก็บเป็น ISO string เช่น "2025-08-10T14:25:00.239Z"
  Quantity?: number;             // จำนวน (uint)
  AADC?: number;                 // รหัสหรือข้อมูลอื่น ๆ เป็น string
  MonthlyGarbage?: number;       // ปริมาณขยะรายเดือน (float)
  AverageDailyGarbage?: number;  // ปริมาณขยะเฉลี่ยรายวัน (float)
  TotalSale?: number | null;    // ยอดขายรวม (float) อาจเป็น null หรือไม่ใส่ก็ได้
  Note?: string | null;         // หมายเหตุ (optional)
  TargetID?: number;             // id ของ target เกณฑ์มาตรฐาน
  UnitID?: number;               // id ของหน่วยนับ
  CustomUnit?: string | null;   // หน่วยนับแบบกำหนดเอง (optional)
  EmployeeID?: number;           // id ของผู้บันทึกข้อมูล
}

export interface listHazardousInterface {
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
    //   TreatmentName: string;
}

export interface DeleteHazardousInterface {
    ID: number;
}