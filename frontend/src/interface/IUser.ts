import { ReactNode } from "react";

export interface UsersInterface {
    ID?: number;
    Username?: string;
    Password?: string;
    Email?: string;
    FirstName?: string;
    LastName?: string;
    Profile?: string ;
    UserRoleID?: number;
    Position?: number;
    Phonenumber?: string;  // หรือ PhoneNumber?  ให้เป็น optional
    PhoneNumber?: ReactNode;  // ใส่เครื่องหมาย ? เพื่อให้เป็น optional
}