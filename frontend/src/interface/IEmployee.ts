import { RoleInterface } from "./IRole";
import { PositionInterface } from "./IPosition";
import { RoomInterface } from "./IRoom";
import { CalendarInterface } from "./ICalendar";
export interface EmployeeInterface {
    ID?: number;
    Firstname?: string;
    Lastname?: string;
    Email?: string;
    Phone?: string;
    Password?: string;
    Profile?: string;

    Role?: RoleInterface;
    Position?: PositionInterface;
    Room?: RoomInterface;
    Calendar?: CalendarInterface;
    
}