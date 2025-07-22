import { ListBeforeAfterTreatmentInterface } from "./IBeforeAfterTreatment";
import { EnvironmentInterface } from "./IEnvironment";
import { ParameterInterface } from "./IParameter";
import { ListStandardInterface } from "./IStandard";
import { ListUnitInterface } from "./IUnit";
import { EmployeeInterface } from "./IEmployee";
export interface EnvironmentalRecordInterface {
    status: number;
    ID?: number;
    Date?: string;
    Data?: number;
    note?: string;

    BeforeAfterTreatmentID?: number;
    BeforeAfterTreatment?: ListBeforeAfterTreatmentInterface;
    Environment?: EnvironmentInterface;
    Parameter?: ParameterInterface;
    Standard?: ListStandardInterface;
    Unit?: ListUnitInterface;
    Employee?: EmployeeInterface;
}

export interface CreateTKNInterface {
    ID?: number;
    Date?: string
    Data?: number;
    Note?:string;
    BeforeAfterTreatmentID?:number;
    StandardID?:number;
    UnitID?:number;
    EmployeeID?:number;
    CustomUnit?:string;
}
export interface CreateTSInterface {
    ID?: number;
    date?: string
    data?: number;
    note?:string;
    beforeAfterTreatmentID?:number;
    standardID?:number;
    unitID?:number;
    employeeID?:number;
}
