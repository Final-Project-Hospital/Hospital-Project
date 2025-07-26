import { HardwareGraphInterface } from "./IHardwareGraph"
import { HardwareParameterColorInterface } from "./IHardwareColor"
import { HardwareStandardInterface } from "./IHardwareStandard";

export interface HardwareParameterInterface {
    ID?: number;
    Parameter?: string;
    HardwareGraph?: HardwareGraphInterface;
    HardwareParameterColor?: HardwareParameterColorInterface;
    StandardHardware?:HardwareStandardInterface
}