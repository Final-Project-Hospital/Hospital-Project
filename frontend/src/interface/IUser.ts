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
    Phonenumber?: string;
    PhoneNumber: ReactNode;
}