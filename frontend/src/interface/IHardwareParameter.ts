import { HardwareGraphInterface } from "./IHardwareGraph"
import { HardwareParameterColorInterface } from "./IHardwareColor"
import { HardwareStandardInterface } from "./IHardwareStandard";
import { UnitHardwareInterface } from "./IUnitHardware";

export interface HardwareParameterInterface {
    ID?: number;
    Parameter?: string;
    Icon?:string;
    GroupDisplay?:boolean;
    LayoutDisplay?:boolean;
    HardwareGraph?: HardwareGraphInterface;
    UnitHardware?:UnitHardwareInterface;
    HardwareParameterColor?: HardwareParameterColorInterface;
    StandardHardware?:HardwareStandardInterface
}