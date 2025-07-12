import { BeforeAfterTreatmentInterface } from "./IBeforeAfterTreatment";
import { EnvironmentInterface } from "./IEnvironment";
export interface EnvironmentalRecordInterface {
    ID? : number;
    date? : string;
    data? : number;
    comment? : string;

    BeforeAfterTreatment? : BeforeAfterTreatmentInterface;
    Environment? : EnvironmentInterface;
    ParameterID? : number;
    StandardID? : number;
    UnitID? : number;
    EmployeeID? : number;
}