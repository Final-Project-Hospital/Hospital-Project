import { HardwareGraphInterface } from "./IHardwareGraph"

export interface HardwareParameterInterface {
    ID?: number;
    Parameter?: string;
    HardwareGraph?: HardwareGraphInterface
}