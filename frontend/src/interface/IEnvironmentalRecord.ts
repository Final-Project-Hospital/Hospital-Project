import { ListBeforeAfterTreatmentInterface } from "./IBeforeAfterTreatment";
import { EnvironmentInterface } from "./IEnvironment";
import { ParameterInterface } from "./IParameter";
import { ListStandardInterface } from "./IStandard";
import { ListUnitInterface } from "./IUnit";
import { EmployeeInterface } from "./IEmployee";
export interface EnvironmentalRecordInterface {
    ID?: number;
    date?: string;
    data?: number;
    note?: string;

    BeforeAfterTreatment?: ListBeforeAfterTreatmentInterface;
    Environment?: EnvironmentInterface;
    Parameter?: ParameterInterface;
    Standard?: ListStandardInterface;
    Unit?: ListUnitInterface;
    Employee?: EmployeeInterface;
}

export interface CreateTKNInterface {
    ID?: number;
    date?: string
    data?:string;
    note?:string;
    beforeAfterTreatmentID?:number;
    standardID?:number;
    unitID?:number;
    employeeID?:number;
}
export interface CreateTSInterface {
    ID?: number;
    date?: string
    data?:string;
    note?:string;
    beforeAfterTreatmentID?:number;
    standardID?:number;
    unitID?:number;
    employeeID?:number;
}
