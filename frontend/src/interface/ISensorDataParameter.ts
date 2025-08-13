import {HardwareParameterInterface} from "./IHardwareParameter"
import {SensorDataInterface} from "./ISensordata"

export interface SensorDataParameterInterface {
  ID?: number;
  Date: string;
  Data: number;
  Note: string;
  Status?: boolean;
  SensorDataID: SensorDataInterface;
  ParameterID: HardwareParameterInterface;
  SensorData?: any;
  HardwareParameter?: any;
}