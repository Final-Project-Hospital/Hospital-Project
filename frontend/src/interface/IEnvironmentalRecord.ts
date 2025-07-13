import { ListBeforeAfterTreatmentInterface } from "./IBeforeAfterTreatment";
import { EnvironmentInterface } from "./IEnvironment";
import { ParameterInterface } from "./IParameter";
import { ListStandardInterface } from "./IStandard";
import { ListUnitInterface } from "./IUnit";
import { EmployeeInterface } from "./IEmployee";
export interface EnvironmentalRecordInterface {
    ID? : number;
    date? : string;
    data? : number;
    comment? : string;

    BeforeAfterTreatment? : ListBeforeAfterTreatmentInterface;
    Environment? : EnvironmentInterface;
    Parameter? : ParameterInterface;
    Standard? : ListStandardInterface;
    Unit? : ListUnitInterface;
    Employee? : EmployeeInterface;
}