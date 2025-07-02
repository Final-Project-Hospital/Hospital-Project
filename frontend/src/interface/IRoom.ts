import {BuildingInterface} from "./IBuilding"
import {HardwareInterface} from "./IHardware"
import {UsersInterface} from "./IUser"

export interface RoomInterface {
    ID?: number;
    RoomName?: string;
    Floor?:string;

    Building?:BuildingInterface;
    Employee?:UsersInterface;
    Hardware?:HardwareInterface;
}