// export interface ListStandardInterface {
//     ID?: number;
//     StandardValue?: number;
// }
export interface ListStandardInterface {
  ID: number;
  MiddleValue?: number; // ค่ากลาง (กรณีเลือกแบบ single)
  MinValue?: number;    // ค่าต่ำสุด (กรณีเลือกเป็นช่วง)
  MaxValue?: number;    // ค่าสูงสุด (กรณีเลือกเป็นช่วง)
}



export interface ListMiddleStandardInterface {
  ID: number;
  MiddleValue: number; // ต้องมี
  MinValue: number;    // = 0
  MaxValue: number;    // = 0
}
export interface ListRangeStandardInterface {
  ID: number;
  MiddleValue: number; // = 0
  MinValue: number;    // ต้องมี
  MaxValue: number;    // ต้องมี
}


export interface AddMiddleStandardInterface {
  MiddleValue: number;
  MinValue: number; // ตั้งค่าเป็น 0
  MaxValue: number; // ตั้งค่าเป็น 0
}
export interface AddRangeStandardInterface {
  MiddleValue: number; // ตั้งค่าเป็น 0
  MinValue: number;
  MaxValue: number;
}
