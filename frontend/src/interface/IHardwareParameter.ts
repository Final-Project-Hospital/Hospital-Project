import { HardwareGraphInterface } from "./IHardwareGraph"
import { HardwareParameterColorInterface } from "./IHardwareColor"

export interface HardwareParameterInterface {
    ID?: number;
    Parameter?: string;
    HardwareGraph?: HardwareGraphInterface;
    HardwareParameterColor?: HardwareParameterColorInterface;
}