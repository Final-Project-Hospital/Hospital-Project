import {HardwareInterface} from "./IHardware"

export interface SensorDataInterface {
    ID?: number;
    Date?: string;
    HardwareID?:HardwareInterface;
}