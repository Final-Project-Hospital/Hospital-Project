export interface ListTargetInterface {
  ID: number;
  MiddleTarget?: number; 
  MinTarget?: number;   
  MaxTarget?: number;    
}

export interface ListMiddleTargetInterface {
  ID: number;
  MiddleTarget: number; // ต้องมี
  MinTarget: number;    // = 0
  MaxTarget: number;    // = 0
}
export interface ListRangeTargetInterface {
  ID: number;
  MiddleTarget: number; // = 0
  MinTarget: number;    // ต้องมี
  MaxTarget: number;    // ต้องมี
}

export interface AddMiddleTargetInterface {
  MiddleTarget: number;
  MinTarget: number; // ตั้งค่าเป็น 0
  MaxTarget: number; // ตั้งค่าเป็น 0
}
export interface AddRangeTargetInterface {
  MiddleTarget: number; // ตั้งค่าเป็น 0
  MinTarget: number;
  MaxTarget: number;
}
