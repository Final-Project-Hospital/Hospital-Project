import {ParameterInterface} from "./IParameter"
import {SensorDataInterface} from "./ISensordata"

export interface SensorDataParameterInterface {
  ID?: number;
  Date: string;
  Data: number;
  SensorDataID: ParameterInterface;
  ParameterID: SensorDataInterface;
  SensorData?: any;
  Parameter?: any;
}