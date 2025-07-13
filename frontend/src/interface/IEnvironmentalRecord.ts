import { BeforeAfterTreatmentInterface } from "./IBeforeAfterTreatment";
import { EnvironmentInterface } from "./IEnvironment";
import { ParameterInterface } from "./IParameter";
import { StandardInterface } from "./IStandard";
import { UnitInterface } from "./IUnit";
import { EmployeeInterface } from "./IEmployee";
export interface EnvironmentalRecordInterface {
    ID? : number;
    date? : string;
    data? : number;
    comment? : string;

    BeforeAfterTreatment? : BeforeAfterTreatmentInterface;
    Environment? : EnvironmentInterface;
    Parameter? : ParameterInterface;
    Standard? : StandardInterface;
    Unit? : UnitInterface;
    Employee? : EmployeeInterface;
}